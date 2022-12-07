const { getBackupSizeList } = require("../../backup.js");
const { getPath } = require('../../helpers/routes.js');

const path = getPath(__filename);

module.exports = [
    {
        verb: 'get',
        path,
        preHandler: (req, res, next) => {
            console.log('pre:' + path + '  __dirname:' + __dirname)
            next();
        },
        routeHandler: async (req, res) => {
            console.log('handler:' + path)
            const backups = await getBackupSizeList();
            res.send(backups);
        }
    }
]
