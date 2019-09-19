"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const yargs = require("yargs");
const mkdirp = require("mkdirp");
const path = require("path");
const fs = require("fs");
const async = require("async");
const readline = require("readline");
/* tslint:disable */
const https = require("follow-redirects").https;
const yauzl = require("yauzl");
/* tslint:enable */
exports.folderNameRegex = /^[a-z0-9_-]+$/;
exports.pluginNameRegex = /^[A-Za-z0-9]+\/[A-Za-z0-9]+$/;
// Data path
const argv = yargs
    .describe("data-path", "Path to store/read data files from, including config and projects")
    .describe("download-url", "Url to download a release")
    .boolean("force")
    .argv;
exports.dataPath = argv["data-path"] != null ? path.resolve(argv["data-path"]) : path.resolve(`${__dirname}/../..`);
mkdirp.sync(exports.dataPath);
mkdirp.sync(`${exports.dataPath}/projects`);
mkdirp.sync(`${exports.dataPath}/builds`);
exports.systemsPath = `${exports.dataPath}/systems`;
mkdirp.sync(exports.systemsPath);
exports.force = argv["force"];
exports.downloadURL = argv["download-url"];
// Systems and plugins
exports.builtInPluginAuthors = ["default", "common", "extra"];
exports.systemsById = {};
for (const entry of fs.readdirSync(exports.systemsPath)) {
    if (!exports.folderNameRegex.test(entry))
        continue;
    if (!fs.statSync(`${exports.systemsPath}/${entry}`).isDirectory)
        continue;
    let systemId;
    let systemVersion;
    const systemPath = `${exports.systemsPath}/${entry}`;
    try {
        const packageDataFile = fs.readFileSync(`${systemPath}/package.json`, { encoding: "utf8" });
        const packageData = JSON.parse(packageDataFile);
        systemId = packageData.ValjangEngine.systemId;
        systemVersion = packageData.version;
    }
    catch (err) {
        emitError(`Could not load system id from systems/${entry}/package.json:`, err.stack);
    }
    let isDev = true;
    try {
        if (!fs.lstatSync(`${systemPath}/.git`).isDirectory())
            isDev = false;
    }
    catch (err) {
        isDev = false;
    }
    exports.systemsById[systemId] = { folderName: entry, version: systemVersion, isDev, plugins: {} };
    let pluginAuthors;
    try {
        pluginAuthors = fs.readdirSync(`${systemPath}/plugins`);
    }
    catch (err) { /* Ignore */ }
    if (pluginAuthors == null)
        continue;
    for (const pluginAuthor of pluginAuthors) {
        if (exports.builtInPluginAuthors.indexOf(pluginAuthor) !== -1)
            continue;
        if (!exports.folderNameRegex.test(pluginAuthor))
            continue;
        exports.systemsById[systemId].plugins[pluginAuthor] = {};
        for (const pluginName of fs.readdirSync(`${systemPath}/plugins/${pluginAuthor}`)) {
            if (!exports.folderNameRegex.test(pluginName))
                continue;
            const pluginPath = `${systemPath}/plugins/${pluginAuthor}/${pluginName}`;
            if (!fs.statSync(pluginPath).isDirectory)
                continue;
            let pluginVersion;
            try {
                const packageDataFile = fs.readFileSync(`${pluginPath}/package.json`, { encoding: "utf8" });
                const packageData = JSON.parse(packageDataFile);
                pluginVersion = packageData.version;
            }
            catch (err) {
                emitError(`Could not load plugin verson from systems/${entry}/${pluginAuthor}/${pluginName}/package.json:`, err.stack);
            }
            let isDev = true;
            try {
                if (!fs.lstatSync(`${pluginPath}/.git`).isDirectory())
                    isDev = false;
            }
            catch (err) {
                isDev = false;
            }
            exports.systemsById[systemId].plugins[pluginAuthor][pluginName] = { version: pluginVersion, isDev };
        }
    }
}
function listAvailableSystems(registry) { console.log(`Available systems: ${Object.keys(registry.systems).join(", ")}.`); }
exports.listAvailableSystems = listAvailableSystems;
function listAvailablePlugins(registry, systemId) {
    const pluginAuthors = Object.keys(registry.systems[systemId].plugins);
    if (pluginAuthors.length === 0) {
        console.log(`No plugins found.`);
    }
    else {
        /* let pluginCount = 0;
        for (const pluginAuthor of pluginAuthors) pluginCount += Object.keys(registry.systems[systemId].plugins[pluginAuthor]).length; */
        for (const pluginAuthor of pluginAuthors) {
            console.log(`  ${pluginAuthor}/`);
            for (const pluginName of Object.keys(registry.systems[systemId].plugins[pluginAuthor]))
                console.log(`    ${pluginName}`);
        }
    }
}
exports.listAvailablePlugins = listAvailablePlugins;
const currentRegistryVersion = 2;
function getRegistry(callback) {
    const registryUrl = "https://raw.githubusercontent.com/ValjangEngine/ValjangEngine-registry/master/registry.json";
    const request = https.get(registryUrl, (res) => {
        if (res.statusCode !== 200) {
            callback(new Error(`Unexpected status code: ${res.statusCode}`), null);
            return;
        }
        let content = "";
        res.on("data", (chunk) => { content += chunk; });
        res.on("end", () => {
            let registry;
            try {
                registry = JSON.parse(content);
            }
            catch (err) {
                callback(new Error(`Could not parse registry as JSON`), null);
                return;
            }
            if (registry.version !== currentRegistryVersion) {
                callback(new Error("The registry format has changed. Please update ValjangEngine."), null);
            }
            else {
                const packageData = fs.readFileSync(`${__dirname}/../../package.json`, { encoding: "utf8" });
                const { version: localCoreVersion } = JSON.parse(packageData);
                registry.core.localVersion = localCoreVersion;
                let isLocalCoreDev = true;
                try {
                    if (!fs.lstatSync(`${__dirname}/../../.git`).isDirectory())
                        isLocalCoreDev = false;
                }
                catch (err) {
                    isLocalCoreDev = false;
                }
                registry.core.isLocalDev = isLocalCoreDev;
                async.each(Object.keys(registry.systems), (systemId, cb) => {
                    const registrySystem = registry.systems[systemId];
                    const localSystem = exports.systemsById[systemId];
                    if (localSystem != null) {
                        registrySystem.localVersion = localSystem.version;
                        registrySystem.isLocalDev = localSystem.isDev;
                    }
                    else {
                        registrySystem.isLocalDev = false;
                    }
                    async.each(Object.keys(registrySystem.plugins), (authorName, cb) => {
                        async.each(Object.keys(registrySystem.plugins[authorName]), (pluginName, cb) => {
                            const registryPlugin = registrySystem.plugins[authorName][pluginName];
                            const localPlugin = localSystem != null && localSystem.plugins[authorName] != null ? localSystem.plugins[authorName][pluginName] : null;
                            if (localPlugin != null) {
                                registryPlugin.localVersion = localPlugin.version;
                                registryPlugin.isLocalDev = localPlugin.isDev;
                            }
                            else {
                                registryPlugin.isLocalDev = false;
                            }
                            cb();
                        }, cb);
                    }, cb);
                }, (err) => { callback(err, registry); });
            }
        });
    });
    request.on("error", (err) => {
        callback(err, null);
    });
}
exports.getRegistry = getRegistry;
function downloadRelease(downloadURL, downloadPath, callback) {
    console.log("0%");
    https.get({
        hostname: "github.com",
        path: downloadURL,
        headers: { "user-agent": "ValjangEngine" }
    }, (res) => {
        if (res.statusCode !== 200) {
            callback(`Unexpected status code: ${res.statusCode}`);
            return;
        }
        let progress = 0;
        let progressMax = parseInt(res.headers["content-length"], 10) * 2;
        const buffers = [];
        res.on("data", (data) => { buffers.push(data); progress += data.length; onProgress(progress / progressMax); });
        res.on("end", () => {
            let zipBuffer = Buffer.concat(buffers);
            yauzl.fromBuffer(zipBuffer, { lazyEntries: true }, (err, zipFile) => {
                if (err != null)
                    throw err;
                progress = zipFile.entryCount;
                progressMax = zipFile.entryCount * 2;
                let rootFolderName;
                zipFile.readEntry();
                zipFile.on("entry", (entry) => {
                    if (rootFolderName == null)
                        rootFolderName = entry.fileName;
                    if (entry.fileName.indexOf(rootFolderName) !== 0)
                        throw new Error(`Found file outside of root folder: ${entry.fileName} (${rootFolderName})`);
                    const filename = path.join(downloadPath, entry.fileName.replace(rootFolderName, ""));
                    if (/\/$/.test(entry.fileName)) {
                        mkdirp(filename, (err) => {
                            if (err != null)
                                throw err;
                            progress++;
                            onProgress(progress / progressMax);
                            zipFile.readEntry();
                        });
                    }
                    else {
                        zipFile.openReadStream(entry, (err, readStream) => {
                            if (err)
                                throw err;
                            mkdirp(path.dirname(filename), (err) => {
                                if (err)
                                    throw err;
                                readStream.pipe(fs.createWriteStream(filename));
                                readStream.on("end", () => {
                                    progress++;
                                    onProgress(progress / progressMax);
                                    zipFile.readEntry();
                                });
                            });
                        });
                    }
                });
                zipFile.on("end", () => {
                    // NOTE: Necessary to allow manipulating files right after download
                    setTimeout(callback, 100);
                });
            });
        });
    });
}
exports.downloadRelease = downloadRelease;
function onProgress(value) {
    value = Math.round(value * 100);
    readline.clearLine(process.stdout, 0);
    readline.cursorTo(process.stdout, 0, 1);
    console.log(`${value}%`);
    if (process != null && process.send != null)
        process.send({ type: "progress", value });
}
function emitError(message, details) {
    console.error(message);
    if (details != null)
        console.error(details);
    if (process != null && process.send != null)
        process.send({ type: "error", message });
    process.exit(1);
}
exports.emitError = emitError;
