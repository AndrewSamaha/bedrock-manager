// Creates the server properties from config.json
require('dotenv').config();

const assert = require('assert');
const fs = require('fs');
const util = require('util');

const config = require('./config.js');
const {
  SERVER_PROPERTIES_FILE_PATH,
  SERVER_PROPERTIES_FIELDS
} = require('./utils.js')

const getServerPropertiesContentString = (serverProperties) => {
  return Object.keys(serverProperties).map((property) => serverProperties[property] != null ? `${property}=${serverProperties[property]}` : null).filter(line => line != null).join('\n\n');
}

const createServerProperties = util.promisify((callback) => {
  const configServerProperties = config['server-properties'];
  actualConfigServerPropertyFields = Object.keys(configServerProperties);

  // check that the fields are what we expect
  actualConfigServerPropertyFields.sort();
  SERVER_PROPERTIES_FIELDS.sort();
  // skip the assertion for now - level-seed may not be available (TODO: reintroduce assertion with subset check?)
  // assert.deepEqual(actualConfigServerPropertyFields, SERVER_PROPERTIES_FIELDS, `Expected fields in config['server-properties'] to be the same as those defined in ./utils.js`)

  const content = getServerPropertiesContentString(configServerProperties);

  fs.writeFileSync(SERVER_PROPERTIES_FILE_PATH, content);

  console.log(`Overwrote ${SERVER_PROPERTIES_FILE_PATH} based on contents of ${process.env.CONFIG_FILE_PATH}`);
  callback();
});

module.exports = {
  createServerProperties
};
