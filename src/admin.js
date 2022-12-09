require('dotenv').config();
const crypto = require("crypto");
const express = require("express");
const fs = require('fs-extra');
const readline = require("readline");

const git = require('git-rev-sync');
const { glob } = require('glob');
const flatten = require('lodash/flatten');

const config = require('./config.js');
const { newlog, MAX_STORED_LINES, consoleLogBuffer, UI_COMMAND_DELAY } = require("./utils.js");
const { getBackupList, getBackupSizeList } = require("./backup.js");


console.log = newlog;

let salt = '0';
const refreshSalt = () => {
    salt = crypto
        .randomBytes(32)
        .toString("hex")
        .toUpperCase();
    return salt;
}

const uiConfig = config.ui;

const setupAdmin = (appContext) => {
    const routePath="/routes/**/*.js"; 
    const gitTag = git.tag();
    const gitBranch = git.branch();
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false
    });
    appContext.rl = rl;
    appContext.getConsoleLogBuffer = () => consoleLogBuffer;
    appContext.refreshSalt = refreshSalt;
    appContext.clientHashIsValid = (clientHashWithSalt) => {
        return (
            (clientHashWithSalt || "").toUpperCase() ===
            crypto
            .createHash("sha256")
            .update(
                uiConfig["admin-code-sha256-hash"].toUpperCase() +
                salt.toUpperCase()
            )
            .digest("hex")
            .toUpperCase()
        );
    }

    if (!(uiConfig || {}).enabled) {
        console.log("Running server without UI");
        return appContext;
    }

    const { bs, clientHashIsValid } = appContext;
    
    console.log("Starting express server");
    const expressApp = express();

    expressApp.use((req, res, next) => {
        req.appContext = appContext;
        next();
    });
    expressApp.use(express.json());
    expressApp.use((req, res, next) => {
        res.append('git-tag', gitTag);
        res.append('git-branch', gitBranch);
        next();
    });

    // Read routes from files
    const routes = flatten(glob.sync(__dirname + routePath).map((file) => require(file)));

    // Assign auth pre-handler for relevant routes
    routes.forEach(({path, requiresAuth}) => requiresAuth && expressApp.use(path, (req, res, next) => {
        if (!clientHashIsValid(req.header("Authorization"))) {
            console.log(`Rejected unauthorized request to ${path}`);
            res.sendStatus(401);
            return;
        }
        next();
    }));
    
    // Assign pre-hooks for each route
    routes.forEach(({path, preHandler}) => preHandler && expressApp.use(path, preHandler));

    const router = express.Router();

    // Assign routes from files
    routes.forEach(({path, verb, routeHandler}) => routeHandler && router[verb](path, routeHandler));

    expressApp.use("/", router);
    expressApp.use(express.static("static"));
    expressApp.listen(uiConfig.port);

    console.log(`Running UI for server on port ${uiConfig.port}`);

    appContext.finishedSettingUpAdmin = true;
    return appContext;
}

module.exports = {
    setupAdmin
}
