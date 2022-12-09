const e = require('express');
const fs = require('fs-extra');
const { getPath } = require('../../helpers/routes.js');
const path = getPath(__filename);

const getFileList = (path) => {
    return fs.readdirSync(path).map((file) => ({
        file,
        modified: fs.statSync(`${path}/${file}`).mtime.getTime()
    }));
}

const comparePaths = (sourcePath, destPath, ignoreThingsNotInSource = true) => {
    let comp = {};
    fs.readdirSync(sourcePath).forEach((file) => {
        comp[file] = {};
        comp[file].modified1 = fs.statSync(`${sourcePath}/${file}`).mtime.getTime();
    });
    fs.readdirSync(destPath).forEach((file) => {
        if (!comp.hasOwnProperty(file)) {
            if (ignoreThingsNotInSource)
                return;
            
            comp[file] = {};
        }
        comp[file].modified2 = fs.statSync(`${destPath}/${file}`).mtime.getTime();
    });
    Object.entries(comp).forEach(([file, c]) => {
        const { modified1, modified2 } = c;
        if (modified1 && modified2) {
            c.diff = modified1 - modified2;
        }
    })
    return comp;
}

const fileListToString = (filelist, title='') => {
    return filelist.reduce((acc, cur) => {
        return `${acc}${JSON.stringify(cur, null, '\t')}<br />\r\n`
    }, title);
}
module.exports = [
    {
        verb: 'get',
        path,
        requiresAuth: false,
        routeHandler: async (req, res) => {
            const { body, appContext } = req;
            const { backup } = body;

            const bpPath = `${process.env.MOD_IMPORT_PATH}/development_behavior_packs`;
            const rpPath = `${process.env.MOD_IMPORT_PATH}/development_resource_packs`;
            const destBpPath = `${process.env.ENVIRONMENT === 'PRODUCTION' ?
                process.env.PRODUCTION_SERVER_PATH : process.env.STAGING_SERVER_PATH}/behavior_packs`;
            const destRpPath = `${process.env.ENVIRONMENT === 'PRODUCTION' ?
                process.env.PRODUCTION_SERVER_PATH : process.env.STAGING_SERVER_PATH}/behavior_packs`

            const bpComparison = comparePaths(bpPath, destBpPath)
            const rpComparison = comparePaths(rpPath, destRpPath);
            let ret = 'Behavior Packs: <br />\r\n';
            ret = `${ret}${JSON.stringify(bpComparison, null, '\t')}<br />\r\n`
            
            ret += '<br />Resource Packs: <br />\r\n';
            ret = `${ret}${JSON.stringify(rpComparison, null, '\t')}<br />\r\n`
            console.log(ret)
            res.send(ret)
        }
    }
]
