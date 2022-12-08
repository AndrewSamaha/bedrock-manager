require('dotenv').config();
const fs = require('fs-extra');
const assert = require("assert");
const { Readable, Writable } = require("stream");
let { spawn, exec } = require("child_process");
const pidusage = require("pidusage");
const { startGameServer } = require('./src/gameServer.js');
const {
    UNZIPPED_SERVERS_CONTAINER,
    UNZIPPED_SERVER_FOLDER_PATH,
    BACKUP_TYPES,
    MS_IN_MIN,
    MS_IN_SEC,
    SAVE_QUERY_FREQUENCY,
    BUCKET_LOCK_FILE_NAME,
    formatBytes,
    platform,
    newlog,
    sec2time
} = require("./src/utils.js");

if (platform === "win32") {
    spawn = require("cross-spawn");
}

const { createServerProperties } = require("./src/create-server-properties.js");

const {
    createBackupBucketIfNotExists,
    downloadRemoteBackups,
    createBackup,
    restoreLocalBackup,
    restoreLatestLocalBackup,
    createUnscheduledBackup,
    getBackupList,
    getBackupSizeList,
    doesLockFileExistOrS3Disabled,
    createLockFileIfS3Enabled,
    deleteLockFileIfExists,
} = require("./src/backup.js");

const { setupAdmin } = require("./src/admin.js");
const config = require('./src/config.js');

const appContext = {
    fs,
    bs: null,
    rl: null,
    backupConfig: config.backup,
    isCurrentlyBackingUp: false,
    hasSentStopCommand: false,
    currentBackupType: null,
    saveQueryInterval: null,
    saveHoldInterval: null,
    requestStopServer: null
};

fs.ensureDirSync(UNZIPPED_SERVERS_CONTAINER);

const backupFrequencyMS = appContext.backupConfig["backup-frequency-minutes"] * MS_IN_MIN;
const minBackupFrequencyMinutes = 10;

assert(backupFrequencyMS > MS_IN_MIN * minBackupFrequencyMinutes,
    `Expected backup['backup-frequency-min'] to be greater than ${minBackupFrequencyMinutes}`);

assert(platform === "linux" || platform === 'win32',
    'Unsupported platform - must be Windows 10 or Ubuntu 18+ based');


console.log = newlog;
// We might need to pass this to spawnServer

createServerProperties().then(async () => {
    await createBackupBucketIfNotExists();
    const doesLockFileExist = await doesLockFileExistOrS3Disabled();
    let saveQueryInterval = null;
    let saveHoldInterval = null;

    if (doesLockFileExist) {
        console.error(`Exiting server; a lock file, ${BUCKET_LOCK_FILE_NAME} exists within the S3 backup bucket.`
            + ' This usually means another server is connected to the backup bucket.'
            + ' This can also happen if the server did not exit gracefully last time.'
            + ' If that is the case, make sure everything is okay, manually delete the lock file from S3, then try starting the server again.')
        process.exit(0);
    }
    await createLockFileIfS3Enabled();
    await downloadRemoteBackups();
    if (process.env.RESTORE_BACKUP_ON_STARTUP === 'true') await restoreLatestLocalBackup();

    console.log(`Starting Minecraft Bedrock server in ${process.env.ENVIRONMENT} mode...`);
    console.log(`Path: ${UNZIPPED_SERVER_FOLDER_PATH}/bedrock_server`)
    
    const gameServerArtifacts = startGameServer(appContext);
    const { bs, requestStopServer } = gameServerArtifacts;
    appContext.bs = bs;
    appContext.requestStopServer = requestStopServer;

    let { rl } = await setupAdmin(appContext);

    let lastQueryWasSaveSucccessful = false;

    saveQueryInterval = setInterval(() => {
        const { isCurrentlyBackingUp } = appContext;
        if (!isCurrentlyBackingUp && bs) {
            bs.stdin.write("save query\r\n");
        }
    }, SAVE_QUERY_FREQUENCY);

    const triggerBackup = backupType => {
        let { isCurrentlyBackingUp, hasSentStopCommand } = appContext;
        if (!hasSentStopCommand && !isCurrentlyBackingUp) {
            // don't backup if hasSentStopCommand is true
            console.log(`Telling server to prepare for backup...`);
            appContext.currentBackupType = backupType;
            bs.stdin.write("save hold\r\n");
        }
    };

    saveHoldInterval = process.env.SCHEDULE_BACKUPS === 'true' ? setInterval(
        triggerBackup,
        backupFrequencyMS,
        BACKUP_TYPES.SCHEDULED
    ) : null;

    const printResourceUsage = () => {
        if (bs != null) {
            pidusage(bs.pid, function(err, stats) {
                console.log(
                    `Resource Usage as of ${new Date().toLocaleString()}:`
                );
                console.log(
                    `CPU Percentage (from 0 to 100*vcore): ${stats.cpu.toFixed(
                    3
                )}%`
                );
                console.log(`RAM: ${formatBytes(stats.memory)}`);
                console.log(
                    `Wrapped Server Uptime : ${sec2time(
                    Math.round(stats.elapsed / 1000)
                )} (hh:mm:ss)`
                );
            });
        }
    };

    const triggerGracefulExit = () => {
        console.log("Backing up, then killing Minecraft server...");
        bs.stdin.write("save hold\r\n");
        requestStopServer(true);
    };

    process.on("SIGINT", async () => {
        bs = null;
        await createUnscheduledBackup(Math.floor(new Date() / 1000));
        process.exit(1);
    });

    rl.on("line", async line => {
        if (/^(\r|\n|)$/i.test(line)) {
            // ignore blank commands
        } else if (/^(stop|exit)$/i.test(line)) {
            triggerGracefulExit();
        } else if (/^(save.*)/i.test(line)) {
            // intercept saves
            console.log(
                `Please use the 'backup' command to create a manual backup`
            );
        } else if (/^(backup)/i.test(line)) {
            triggerBackup(BACKUP_TYPES.MANUAL);
        } else if (/^(resource-usage)$/i.test(line)) {
            printResourceUsage();
        } else if (/^(list)$/i.test(line)) {
            bs.stdin.write(`list\r\n`);
        } else if (/^(force-restore)/i.test(line)) {
            const lineSplit = line.split("force-restore ");
            if (lineSplit.length > 0) {
                console.log("ATTENTION: Forcefully killing server and overwriting world state with specified backup - current world state will be lost");
                bs.stdin.write("stop\r\n");
                bs = null;
                setTimeout(async () => {
                    await createUnscheduledBackup(
                        Math.floor(new Date() / 1000)
                    );
                    const didSuccessfulyRestore = await restoreLocalBackup(
                        lineSplit[1]
                    );
                    if (!didSuccessfulyRestore) {
                        console.log(
                            "Unable to restore backup - restarting server as is"
                        );
                    }
                    spawnServer();
                }, 2 * MS_IN_SEC);
            } else {
                console.error("USAGE: restore <BACKUP_FILE_NAME>");
            }
        } else {
            console.log("Recognized commands: backup, force-restore <BACKUP_FILE_NAME>, resource-usage, stop");
            console.log("Piping the command directly to the underlying base Minecraft server since this command was not recognized by the node wrapper");
            bs.stdin.write(`${line}\r\n`);
        }
    });
});
