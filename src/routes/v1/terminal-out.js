const { getPath } = require('../../helpers/routes.js');
const { MAX_STORED_LINES } = require("../../utils.js");

const path = getPath(__filename);

module.exports = [
    {
        verb: 'get',
        path,
        requiresAuth: false,
        routeHandler: async (req, res) => {
            const consoleLogBuffer = req.appContext.getConsoleLogBuffer();
            res.send(
                [`${MAX_STORED_LINES} latest lines of terminal output:`]
                .concat(consoleLogBuffer)
                .join("<br>")
            );
        }
    }
]
