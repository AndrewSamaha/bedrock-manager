const { UI_COMMAND_DELAY } = require("../../utils.js");
const { getPath } = require('../../helpers/routes.js');
const path = getPath(__filename);

module.exports = [
    {
        verb: 'post',
        path,
        requiresAuth: true,
        routeHandler: async (req, res) => {
            const { rl } = req.appContext;
            setTimeout(() => { rl.write("list\n"); }, UI_COMMAND_DELAY);
            res.sendStatus(200);
        }
    }
]
