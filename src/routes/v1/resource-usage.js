const pidusage = require("pidusage");

const { getPath } = require('../../helpers/routes.js');

const path = getPath(__filename);

module.exports = [
    {
        verb: 'get',
        path,
        requiresAuth: false,
        routeHandler: async (req, res) => {
            const { bs } = req.appContext;
            if (bs != null) {
                pidusage(bs.pid, (err, stats) => {
                    let result = {};
                    if (stats != null) {
                        result = {
                            cpu: stats.cpu,
                            elapsed: stats.elapsed,
                            memory: stats.memory
                        };
                    }
                    res.send(result);
                });
            } else {
                res.send({});
            }
        }
    }
]
