const { getBackupSizeList } = require("../../backup.js");

const path = "/backup-size-list";

module.exports = {
    path,
    preHandler: (req, res, next) => {
        console.log('pre', path)
        next();
    },
    routeHandler: async (req, res) => {
        console.log('handler', path)
        const backups = await getBackupSizeList();
        res.send(backups);
    }
}
