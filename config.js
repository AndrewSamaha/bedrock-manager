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
    'server-properties.server-port',
    process.env.ENVIRONMENT === "PRODUCTION" ? process.env.PRODUCTION_SERVER_PORT : process.env.STAGING_SERVER_PORT)

set(config,
    'server-properties.server-portv6',
    process.env.ENVIRONMENT === "PRODUCTION" ? process.env.PRODUCTION_SERVER_PORTV6 : process.env.STAGING_SERVER_PORTV6)
    

set(config,
    "ui.admin-code-sha256-hash",
    process.env.UI_ADMIN_HASH);

set(config,
    "ui.port",
    process.env.UI_PORT);
    

module.exports = config;
 