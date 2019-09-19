"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const readline = require("readline");
const rimraf = require("rimraf");
const fs = require("fs");
const utils = require("./utils");
function uninstall(systemId, pluginFullName) {
    const localSystem = utils.systemsById[systemId];
    if (localSystem == null)
        utils.emitError(`System ${systemId} is not installed.`);
    if (pluginFullName == null) {
        // Uninstall system
        if (localSystem.isDev)
            utils.emitError(`System ${systemId} is a development version.`);
        if (utils.force) {
            uninstallSystem(localSystem.folderName);
            return;
        }
        const r1 = readline.createInterface({ input: process.stdin, output: process.stdout });
        r1.question(`Are you sure you want to uninstall the system ${systemId}? (yes/no): `, (answer) => {
            if (answer === "yes") {
                console.log(`Uninstalling system ${systemId}...`);
                uninstallSystem(localSystem.folderName);
            }
            else {
                console.log(`Uninstall canceled.`);
                process.exit(0);
            }
        });
    }
    else {
        // Uninstall plugin
        const [authorName, pluginName] = pluginFullName.split("/");
        if (utils.builtInPluginAuthors.indexOf(authorName) !== -1)
            utils.emitError(`Built-in plugins can not be uninstalled.`);
        const localPlugin = localSystem.plugins[authorName] != null ? localSystem.plugins[authorName][pluginName] : null;
        if (localPlugin == null)
            utils.emitError(`Plugin ${pluginFullName} is not installed.`);
        if (localPlugin.isDev)
            utils.emitError(`Plugin ${pluginFullName} is a development version.`);
        if (utils.force) {
            uninstallPlugin(localSystem.folderName, pluginFullName, authorName);
            return;
        }
        const r1 = readline.createInterface({ input: process.stdin, output: process.stdout });
        r1.question(`Are you sure you want to uninstall the plugin ${pluginFullName}? (yes/no): `, (answer) => {
            if (answer === "yes") {
                console.log(`Uninstalling plugin ${pluginFullName} from system ${systemId}...`);
                uninstallPlugin(localSystem.folderName, pluginFullName, authorName);
            }
            else {
                console.log(`Uninstall canceled.`);
                process.exit(0);
            }
        });
    }
}
exports.default = uninstall;
function uninstallSystem(systemFolderName) {
    rimraf(`${utils.systemsPath}/${systemFolderName}`, (err) => {
        if (err != null) {
            utils.emitError(`Failed to uninstalled system.`);
        }
        else {
            console.log("System successfully uninstalled.");
            process.exit(0);
        }
    });
}
function uninstallPlugin(systemFolderName, pluginFullName, authorName) {
    rimraf(`${utils.systemsPath}/${systemFolderName}/plugins/${pluginFullName}`, (err) => {
        if (err != null) {
            utils.emitError(`Failed to uninstalled plugin.`);
        }
        else {
            if (fs.readdirSync(`${utils.systemsPath}/${systemFolderName}/plugins/${authorName}`).length === 0)
                fs.rmdirSync(`${utils.systemsPath}/${systemFolderName}/plugins/${authorName}`);
            console.log("Plugin successfully uninstalled.");
            process.exit(0);
        }
    });
}
