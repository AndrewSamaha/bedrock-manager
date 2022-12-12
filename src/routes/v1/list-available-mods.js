const e = require('express');
const fs = require('fs-extra');
const flatten = require('lodash/flatten');
const { formatDistance, formatDistanceToNow } = require('date-fns');

const { getPath } = require('../../helpers/routes.js');
const path = getPath(__filename);

const comparePaths = (sourcePath, destPath, type) => {
    const ignore = ['.gitignore'];
    const options = { addSuffix: false, includeSeconds: true };

    let fileDict = { ...fs.readdirSync(sourcePath).map((filename) => {
        if (ignore.includes(filename)) return null;
        const sourceFullPath = `${sourcePath}/${filename}`;
        return {
            [sourceFullPath]: {
                type,
                filename, 
                sourcePath,
                sourceMTime: fs.statSync(sourceFullPath).mtime.getTime(),
                sourceFullPath,
                destPath
            }
        };
    }).reduce((acc, cur) => {
        if (!cur) return acc;
        return { ...acc, ...cur }
    }, {})}
    
    fileDict = { ...fs.readdirSync(destPath).map((filename) => {
        const sourceFullPath = `${sourcePath}/${filename}`;
        const destFullPath = `${destPath}/${filename}`;
        if (!fileDict[sourceFullPath]) return null;
        return {
            [sourceFullPath]: {
                ...fileDict[sourceFullPath],
                destPath,
                destMTime: fs.statSync(destFullPath).mtime.getTime(),
                destFullPath
            }
        }
    }).reduce((acc, cur) => {
        if (!cur) return acc;
        return { ...acc, ...cur }
    }, fileDict)};
    
    const files = Object.entries(fileDict).map(([fullSourcePath, fileObj]) => {
        const { sourceMTime, destMTime } = fileObj;
        if (!destMTime) return {
            ...fileObj,
            diff: null,
            diffStr: 'mod not found on server',
            updatable: true
        }
        const diff = sourceMTime - destMTime;
        const diffStr = (() => {
            if (diff > 0) return `a newer version has been available for ${formatDistanceToNow(new Date(sourceMTime), options)}`;
            if (diff < 0) return `the game-server is using files ${formatDistance(new Date(sourceMTime), new Date(destMTime), options)} newer`;
            return `files are in-sync`;
        })();
        return {
            ...fileObj,
            diff,
            diffStr,
            updatable: diff > 0 ? true : false
        };
    });

    return files;
}

const createPath = (type) => ({
    type,
    source: `${process.env.MOD_IMPORT_PATH}/development_${type}`,
    dest:   `${process.env.ENVIRONMENT === 'PRODUCTION' ?
                process.env.PRODUCTION_SERVER_PATH : 
                process.env.STAGING_SERVER_PATH}/${type}`
})

module.exports = [
    {
        verb: 'get',
        path,
        requiresAuth: false,
        routeHandler: async (req, res) => {
            const { body, appContext } = req;
            const { backup } = body;

            const files = flatten([
                createPath('behavior_packs'),
                createPath('resource_packs')
            ].map(({source, dest, type}) => comparePaths(source, dest, type)))

            const updatableMods = files.filter(({updatable}) => updatable)
            
            const ret = `${JSON.stringify(updatableMods, null, '\t')}<br />\r\n${updatableMods.length} / ${files.length}\r\n`;

            console.log('finished result:')
            console.log(ret)
            res.send(ret)
        }
    }
]
