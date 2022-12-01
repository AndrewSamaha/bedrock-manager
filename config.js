const get = require('lodash/get')
const set = require('lodash/set')
const fs = require('fs-extra');

const config = JSON.parse(fs.readFileSync(process.env.CONFIG_FILE_PATH, 'utf8'));

set(config,
    "server-properties.server-name",
    `${get(config, 'server-properties.server-name','unknown server')} ${process.env.ENVIRONMENT}`);

set(config,
    "server-properties.level-name",
    `${get(config, 'server-properties.level-name','unknown level')} ${process.env.ENVIRONMENT}`);

set(config,
    "ui.admin-code-sha256-hash",
    process.env.UI_ADMIN_HASH);

set(config,
    "ui.port",
    process.env.UI_PORT);
    

module.exports = config;
 