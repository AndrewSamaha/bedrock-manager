let { spawn, exec } = require("child_process");

const { UNZIPPED_SERVER_FOLDER_PATH, MS_IN_SEC } = require("./utils.js");
const { createBackup, deleteLockFileIfExists } = require("./backup.js");

const startGameServer = (args) => {
    // Might also need to pass the changed console.lgo or newlog to this func
    const { saveQueryInterval, saveHoldInterval } = args;
    let gameIsWritingToDisk = false;
    let stopServerWhenSafe = false;

    const bs = spawn("./bedrock_server", [], {
        stdio: ["pipe", "pipe", "pipe", "ipc"],
        cwd: UNZIPPED_SERVER_FOLDER_PATH
    });

    const requestStopServer = (backup) => {
        if (backup) {
            bs.stdin.write("save hold\r\n");
        }
        stopServerWhenSafe = true;
    };

    const stopServer = () => {
        clearInterval(saveQueryInterval);
        clearInterval(saveHoldInterval);
        bs.stdin.write("stop\r\n");
        setTimeout(async () => {
            await deleteLockFileIfExists();
            process.exit(0);
        }, MS_IN_SEC);
    }

    bs.stderr.on("data", error => {
        console.error(`SERVER STDERROR: ${error}`);
    });

    bs.on("error", data => {
        console.log(`SERVER ERROR: ${data}`);
    });

    bs.on("close", code => {
        console.log(
            `Minecraft server child process exited with code ${code}`
        );
    });

    bs.stdout?.on("data", async data => {
        // Check to see if the game server is currently writing to the world to disk
        if (/^(A previous save has not been completed\.|Saving\.\.\.|Changes to the level are resumed\.)/i.test(data)) {
            // Yep, do nothing
            gameIsWritingToDisk = true;
        } else if (/^(Data saved\. Files are now ready to be copied\.)/i.test(data)) {
            gameIsWritingToDisk = false;
            // Nope, see if we need to do a backup
            const backupStartTime = Math.floor(new Date() / 1000);
            const backupType = 'undefined backupType';
            console.log(
                `Files ready for backup! Creating backup of server state at ${new Date(
                    backupStartTime * MS_IN_SEC
                ).toLocaleString()} with type ${backupType}...`
            );

            const dataSplit = data
                .toString()
                .split(
                    "Data saved. Files are now ready to be copied."
                );
            const backupFileListString = dataSplit[
                dataSplit.length - 1
            ].replace(/(\n|\r|\\n|\\r)/g, "");
            await createBackup(
                backupFileListString,
                backupStartTime,
                backupType
            );

            bs.stdin.write("save resume\r\n");
            if (stopServerWhenSafe) {
                stopServer();
            }
        } else {
            console.log(`${data.toString().replace(/\n$/, "")}`);
        }
    });

    return {
        bs,
        requestStopServer
    };
};

module.exports = {
    startGameServer
}
