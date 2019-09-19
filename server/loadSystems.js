"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs");
const express = require("express");
const async = require("async");
const getLocalizedFilename_1 = require("./getLocalizedFilename");
function shouldIgnoreFolder(pluginName) { return pluginName.indexOf(".") !== -1 || pluginName === "node_modules"; }
function default_1(mainApp, buildApp, callback) {
    async.eachSeries(fs.readdirSync(SupCore.systemsPath), (systemFolderName, cb) => {
        if (systemFolderName.indexOf(".") !== -1) {
            cb();
            return;
        }
        const systemPath = path.join(SupCore.systemsPath, systemFolderName);
        if (!fs.statSync(systemPath).isDirectory()) {
            cb();
            return;
        }
        const systemId = JSON.parse(fs.readFileSync(path.join(SupCore.systemsPath, systemFolderName, "package.json"), { encoding: "utf8" })).ValjangEngine.systemId;
        SupCore.system = SupCore.systems[systemId] = new SupCore.System(systemId, systemFolderName);
        // Expose public stuff
        try {
            fs.mkdirSync(`${systemPath}/public`);
        }
        catch (err) { /* Ignore */ }
        mainApp.use(`/systems/${systemId}`, express.static(`${systemPath}/public`));
        if (buildApp !== mainApp)
            buildApp.use(`/systems/${systemId}`, express.static(`${systemPath}/public`));
        // Write templates list
        let templatesList = [];
        const templatesFolder = `${systemPath}/public/templates`;
        if (fs.existsSync(templatesFolder))
            templatesList = fs.readdirSync(templatesFolder);
        fs.writeFileSync(`${systemPath}/public/templates.json`, JSON.stringify(templatesList, null, 2));
        // Load server-side system module
        const systemServerModulePath = `${systemPath}/server`;
        if (fs.existsSync(systemServerModulePath)) {
            /* tslint:disable */
            require(systemServerModulePath);
            /* tslint:enable */
        }
        // Load plugins
        const pluginsInfo = SupCore.system.pluginsInfo = loadPlugins(systemId, `${systemPath}/plugins`, mainApp, buildApp);
        fs.writeFileSync(`${systemPath}/public/plugins.json`, JSON.stringify(pluginsInfo, null, 2));
        cb();
    }, () => {
        const systemsInfo = { list: Object.keys(SupCore.systems) };
        fs.writeFileSync(`${__dirname}/../public/systems.json`, JSON.stringify(systemsInfo, null, 2));
        SupCore.system = null;
        callback();
    });
}
exports.default = default_1;
function loadPlugins(systemId, pluginsPath, mainApp, buildApp) {
    const pluginNamesByAuthor = {};
    const pluginsInfo = { list: [], paths: { editors: {}, tools: {} } };
    let pluginsFolder;
    try {
        pluginsFolder = fs.readdirSync(pluginsPath);
    }
    catch (err) { /* Ignore */ }
    if (pluginsFolder == null)
        return pluginsInfo;
    for (const pluginAuthor of pluginsFolder) {
        const pluginAuthorPath = `${pluginsPath}/${pluginAuthor}`;
        if (shouldIgnoreFolder(pluginAuthor))
            continue;
        pluginNamesByAuthor[pluginAuthor] = [];
        for (const pluginName of fs.readdirSync(pluginAuthorPath)) {
            if (shouldIgnoreFolder(pluginName))
                continue;
            const pluginPath = `${pluginsPath}/${pluginAuthor}/${pluginName}`;
            if (!fs.statSync(pluginPath).isDirectory())
                continue;
            pluginNamesByAuthor[pluginAuthor].push(pluginName);
        }
    }
    Object.keys(pluginNamesByAuthor).forEach((pluginAuthor) => {
        const pluginNames = pluginNamesByAuthor[pluginAuthor];
        const pluginAuthorPath = `${pluginsPath}/${pluginAuthor}`;
        pluginNames.forEach((pluginName) => {
            const pluginPath = `${pluginAuthorPath}/${pluginName}`;
            // Load data module
            const dataModulePath = `${pluginPath}/data/index.js`;
            if (fs.existsSync(dataModulePath)) {
                /* tslint:disable */
                require(dataModulePath);
                /* tslint:enable */
            }
            // Collect plugin info
            pluginsInfo.list.push(`${pluginAuthor}/${pluginName}`);
            if (fs.existsSync(`${pluginPath}/public/editors`)) {
                const editors = fs.readdirSync(`${pluginPath}/public/editors`);
                editors.forEach((editorName) => {
                    // Ignore folders with no index.html
                    try {
                        const stats = fs.lstatSync(`${pluginPath}/public/editors/${editorName}/index.html`);
                        if (!stats.isFile())
                            return;
                    }
                    catch (err) {
                        if (err.code === "ENOENT")
                            return;
                        throw err;
                    }
                    if (SupCore.system.data.assetClasses[editorName] != null) {
                        pluginsInfo.paths.editors[editorName] = `${pluginAuthor}/${pluginName}`;
                    }
                    else {
                        pluginsInfo.paths.tools[editorName] = `${pluginAuthor}/${pluginName}`;
                    }
                    mainApp.get(`/systems/${systemId}/plugins/${pluginAuthor}/${pluginName}/editors/${editorName}`, (req, res) => {
                        const languageCode = req.cookies["supLanguage"];
                        const editorPath = path.join(pluginPath, "public/editors", editorName);
                        const localizedIndexFilename = getLocalizedFilename_1.default("index.html", languageCode);
                        fs.exists(path.join(editorPath, localizedIndexFilename), (exists) => {
                            if (exists)
                                res.sendFile(path.join(editorPath, localizedIndexFilename));
                            else
                                res.sendFile(path.join(editorPath, `index.html`));
                        });
                    });
                });
            }
            // Expose public stuff
            mainApp.get(`/systems/${systemId}/plugins/${pluginAuthor}/${pluginName}/locales/*.json`, (req, res) => {
                const localeFile = req.path.split("/locales/")[1];
                const localePath = path.join(pluginPath, "public/locales", localeFile);
                fs.exists(localePath, (exists) => {
                    if (exists)
                        res.sendFile(localePath);
                    else
                        res.send("{}");
                });
            });
            let exposePluginBundles = (app) => {
                app.get(`/systems/${systemId}/plugins/${pluginAuthor}/${pluginName}/bundles/*.js`, (req, res) => {
                    const bundleFile = req.path.split("/bundles/")[1];
                    const bundlePath = path.join(pluginPath, "public/bundles", bundleFile);
                    fs.exists(bundlePath, (exists) => {
                        if (exists)
                            res.sendFile(bundlePath);
                        else
                            res.send("");
                    });
                });
                app.use(`/systems/${systemId}/plugins/${pluginAuthor}/${pluginName}`, express.static(`${pluginPath}/public`));
            };
            exposePluginBundles(mainApp);
            if (buildApp !== mainApp)
                exposePluginBundles(buildApp);
        });
    });
    return pluginsInfo;
}
