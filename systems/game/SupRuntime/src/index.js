"use strict";
/// <reference path="../SupRuntime.d.ts" />
/// <reference path="../../../../SupCore/SupCore.d.ts" />
/// <reference path="../../../../SupClient/typings/SupApp.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
const async = require("async");
const querystring = require("querystring");
const fetch_1 = require("../../../../SupClient/fetch");
const Player_1 = require("./Player");
exports.Player = Player_1.default;
exports.plugins = {};
exports.resourcePlugins = {};
function registerPlugin(name, plugin) {
    if (exports.plugins[name] != null) {
        console.error(`SupRuntime.registerPlugin: Tried to register two or more plugins named "${name}"`);
        return;
    }
    exports.plugins[name] = plugin;
}
exports.registerPlugin = registerPlugin;
function registerResource(name, plugin) {
    if (exports.resourcePlugins[name] != null) {
        console.error(`SupRuntime.registerResource: Tried to register two or more resources named "${name}"`);
        return;
    }
    exports.resourcePlugins[name] = plugin;
}
exports.registerResource = registerResource;
SupCore.system = new SupCore.System("", "");
// Setup SupApp
if (global.SupApp == null) {
    global.SupApp = null;
    try {
        global.SupApp = (top.SupApp != null) ? top.SupApp : null;
    }
    catch (err) {
        /* Ignore */
    }
}
// In app, open links in a browser window
let playerWindow;
let electron;
if (SupApp != null) {
    playerWindow = SupApp.getCurrentWindow();
}
else {
    const nodeRequire = require;
    try {
        electron = nodeRequire("electron");
    }
    catch (e) { /* Ignore */ }
    if (electron != null)
        playerWindow = electron.remote.getCurrentWindow();
}
if (playerWindow != null) {
    document.body.addEventListener("click", (event) => {
        if (event.target.tagName !== "A")
            return;
        event.preventDefault();
        const url = event.target.href;
        if (SupApp != null)
            SupApp.openLink(url);
        else
            electron.shell.openExternal(url);
    });
    if (SupApp != null)
        SupApp.onMessage("force-quit", () => { playerWindow.close(); });
}
const qs = querystring.parse(window.location.search.slice(1));
document.body.addEventListener("keydown", (event) => {
    if (event.keyCode === window["KeyEvent"].DOM_VK_F12) {
        if (qs.project != null && playerWindow != null)
            playerWindow.webContents.toggleDevTools();
    }
});
const progressBar = document.querySelector("progress");
const loadingElt = document.getElementById("loading");
const canvas = document.querySelector("canvas");
// Prevent keypress events from leaking out to a parent window
// They might trigger scrolling for instance
canvas.addEventListener("keypress", (event) => { event.preventDefault(); });
// Make sure the focus is always on the game canvas wherever we click on the game window
document.addEventListener("click", () => canvas.focus());
if (qs.debug != null && playerWindow != null)
    playerWindow.webContents.openDevTools();
let player;
const onLoadProgress = (value, max) => {
    progressBar.value = value;
    progressBar.max = max;
};
const onLoaded = (err) => {
    if (err != null) {
        console.error(err);
        const aElt = loadingElt.querySelector("a");
        aElt.parentElement.removeChild(aElt);
        const errorElt = document.createElement("div");
        errorElt.className = "error";
        errorElt.textContent = err.message;
        loadingElt.appendChild(errorElt);
        return;
    }
    setTimeout(() => {
        loadingElt.classList.remove("start");
        loadingElt.classList.add("end");
        setTimeout(() => {
            loadingElt.parentElement.removeChild(loadingElt);
            player.run();
            return;
        }, (qs.project == null) ? 500 : 0);
    }, (qs.project == null) ? 500 : 0);
};
// Load plugins
const pluginBundleNames = ["components", "runtime", "typescriptAPI"];
fetch_1.default("plugins.json", "json", (err, pluginsInfo) => {
    if (err != null) {
        console.log(err);
        onLoaded(new Error("Could not load plugins list."));
        return;
    }
    async.each(pluginsInfo.list, (pluginName, cb) => {
        async.each(pluginBundleNames, (bundle, cb) => {
            const script = document.createElement("script");
            script.src = `plugins/${pluginName}/bundles/${bundle}.js`;
            script.addEventListener("load", () => cb(null));
            script.addEventListener("error", (err) => cb(null));
            document.body.appendChild(script);
        }, cb);
    }, (err) => {
        if (err != null)
            console.log(err);
        // Load game
        const buildPath = (qs.project != null) ? `/builds/${qs.project}/${qs.build}/` : "./";
        player = new Player_1.default(canvas, buildPath, { debug: qs.debug != null });
        player.load(onLoadProgress, onLoaded);
    });
});
loadingElt.classList.add("start");
