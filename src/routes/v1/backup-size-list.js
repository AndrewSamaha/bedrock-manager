const { getBackupSizeList } = require("../../backup.js");

const path = "/backup-size-list";

module.exports.registerPreHook = (app) => {
    app.use(path, async (req, res, next) => {
        console.log('pre', path)
        next();
    });
};

module.exports.registerRoute = (router) => { 
    router.get(path, async (req, res) => {
        console.log('handler', path)
        const backups = await getBackupSizeList();
        res.send(backups);
    });
}
