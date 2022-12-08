const { getBackupSizeList } = require("../../backup.js");
const { getPath } = require('../../helpers/routes.js');

const path = getPath(__filename);

module.exports = [
    {
        verb: 'get',
        path,
        requiresAuth: true,
        preHandler: (req, res, next) => {
            next();
        },
        routeHandler: async (req, res) => {
            const backups = await getBackupSizeList();
            res.send(backups);
        }
    }
]
