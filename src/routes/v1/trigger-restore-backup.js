const { UI_COMMAND_DELAY } = require("../../utils.js");
const { getBackupList } = require("../../backup.js");
const { getPath } = require('../../helpers/routes.js');
const path = getPath(__filename);

module.exports = [
    {
        verb: 'post',
        path,
        requiresAuth: true,
        routeHandler: async (req, res) => {
            const { body, appContext } = req;
            const { backup } = body;
            const { rl } = appContext;

            const backups = await getBackupList();
            if (!backups.includes(backup)) {
                console.log(`Backup ${body.backup} not found`);
                res.sendStatus(200);
                return
            }
            setTimeout(() => { rl.write(`force-restore ${body.backup}\n`); }, UI_COMMAND_DELAY);            
            res.sendStatus(200);
        }
    }
]
