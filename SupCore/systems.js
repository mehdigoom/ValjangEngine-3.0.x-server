"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
exports.systems = {};
function shouldIgnoreFolder(pluginName) { return pluginName.indexOf(".") !== -1 || pluginName === "node_modules"; }
class System {
    constructor(id, folderName) {
        this.id = id;
        this.folderName = folderName;
        this.plugins = {};
        this.data = new SystemData(this);
    }
    requireForAllPlugins(filePath) {
        const pluginsPath = path.resolve(`${SupCore.systemsPath}/${this.folderName}/plugins`);
        for (const pluginAuthor of fs.readdirSync(pluginsPath)) {
            const pluginAuthorPath = `${pluginsPath}/${pluginAuthor}`;
            if (shouldIgnoreFolder(pluginAuthor))
                continue;
            for (const pluginName of fs.readdirSync(pluginAuthorPath)) {
                if (shouldIgnoreFolder(pluginName))
                    continue;
                const completeFilePath = `${pluginAuthorPath}/${pluginName}/${filePath}`;
                if (fs.existsSync(completeFilePath)) {
                    /* tslint:disable */
                    require(completeFilePath);
                    /* tslint:enable */
                }
            }
        }
    }
    registerPlugin(contextName, pluginName, plugin) {
        if (this.plugins[contextName] == null)
            this.plugins[contextName] = {};
        if (this.plugins[contextName][pluginName] != null) {
            console.error("SupCore.system.registerPlugin: Tried to register two or more plugins " +
                `named "${pluginName}" in context "${contextName}", system "${this.id}"`);
        }
        this.plugins[contextName][pluginName] = plugin;
    }
    getPlugins(contextName) {
        return this.plugins[contextName];
    }
}
exports.System = System;
class SystemData {
    constructor(system) {
        this.system = system;
        this.assetClasses = {};
        this.resourceClasses = {};
    }
    registerAssetClass(name, assetClass) {
        if (this.assetClasses[name] != null) {
            console.log(`SystemData.registerAssetClass: Tried to register two or more asset classes named "${name}" in system "${this.system.id}"`);
            return;
        }
        this.assetClasses[name] = assetClass;
        return;
    }
    registerResource(id, resourceClass) {
        if (this.resourceClasses[id] != null) {
            console.log(`SystemData.registerResource: Tried to register two or more plugin resources named "${id}" in system "${this.system.id}"`);
            return;
        }
        this.resourceClasses[id] = resourceClass;
    }
}
