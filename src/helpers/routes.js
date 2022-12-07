const getPath = (filename) => filename.match(/(routes)+(.*)+(\.js)+/i)[2];

module.exports = {
    getPath
}
