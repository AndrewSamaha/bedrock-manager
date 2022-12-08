const { getPath } = require('../../helpers/routes.js');
const path = getPath(__filename);

module.exports = [
    {
        verb: 'get',
        path,
        requiresAuth: false,
        routeHandler: async (req, res) => {
            const { refreshSalt } = req.appContext;
            res.send(refreshSalt());
        }
    }
]
