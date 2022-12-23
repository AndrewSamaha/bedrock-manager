const get = require('lodash/get')
const set = require('lodash/set')
const fs = require('fs-extra');

const config = JSON.parse(fs.readFileSync(`${process.env.CONFIG_FILE_PATH}`, 'utf8'));

set(config, "ui.admin-code-sha256-hash", process.env.UI_ADMIN_HASH);
set(config, "ui.port", process.env.UI_PORT);

set(config, "server-properties.server-name", `${process.env.GAME_SERVER_NAME} ${process.env.ENVIRONMENT}`);
set(config, 'server-properties.server-port', process.env.GAME_SERVER_PORT);
set(config, 'server-properties.server-portv6', process.env.GAME_SERVER_PORTV6);

module.exports = config;
 