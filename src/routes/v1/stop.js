const { UI_COMMAND_DELAY } = require("../../utils.js");
const { getPath } = require('../../helpers/routes.js');
const path = getPath(__filename);

module.exports = [
    {
        verb: 'post',
        path,
        requiresAuth: false,
        routeHandler: async (req, res) => {
            const { clientHashIsValid, rl } = req.appContext;
            
            if (!clientHashIsValid(req.header("Authorization"))) {
                console.log("Rejected unauthorized request to stop server");
                res.sendStatus(401);
                return;
            }

            setTimeout(() => { rl.write("stop\n") }, UI_COMMAND_DELAY);

            res.sendStatus(200);
        }
    }
]
