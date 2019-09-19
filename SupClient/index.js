"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const io = require("socket.io-client");
const url = require("url");
const querystring = require("querystring");
const cookies = require("js-cookie");
exports.cookies = cookies;
const fetch_1 = require("./fetch");
exports.fetch = fetch_1.default;
const loadScript_1 = require("./loadScript");
exports.loadScript = loadScript_1.default;
const readFile_1 = require("./readFile");
exports.readFile = readFile_1.default;
const ProjectClient_1 = require("./ProjectClient");
exports.ProjectClient = ProjectClient_1.default;
const events_1 = require("./events");
exports.setupHotkeys = events_1.setupHotkeys;
exports.setupHelpCallback = events_1.setupHelpCallback;
const table = require("./table");
exports.table = table;
const Dialogs = require("simple-dialogs");
exports.Dialogs = Dialogs;
const FindAssetDialog_1 = require("./FindAssetDialog");
const i18n = require("./i18n");
exports.i18n = i18n;
const html_1 = require("./html");
exports.html = html_1.default;
require("./events");
const ResizeHandle = require("resize-handle");
exports.query = querystring.parse(window.location.search.slice(1));
Dialogs.FindAssetDialog = FindAssetDialog_1.default;
// Refuses filesystem-unsafe characters
// See http://superuser.com/q/358855
exports.namePattern = "[^\\\\/:*?\"<>|\\[\\]]+";
// Expose SupApp to iframes
if (global.SupApp == null) {
    global.SupApp = (top.SupApp != null) ? top.SupApp : null;
}
// Initialize empty system
SupCore.system = new SupCore.System("", "");
const plugins = {};
const scriptPathRegex = /^\/systems\/([^\/])+\/plugins\/([^\/])+\/([^\/])+/;
function registerPlugin(contextName, pluginName, plugin) {
    if (plugins[contextName] == null)
        plugins[contextName] = {};
    if (plugins[contextName][pluginName] != null) {
        console.error("SupClient.registerPlugin: Tried to register two or more plugins " +
            `named "${pluginName}" in context "${contextName}"`);
        return;
    }
    const scriptURL = url.parse(document.currentScript.src);
    const pluginPath = scriptPathRegex.exec(scriptURL.pathname)[0];
    plugins[contextName][pluginName] = { path: pluginPath, content: plugin };
}
exports.registerPlugin = registerPlugin;
function getPlugins(contextName) {
    return plugins[contextName];
}
exports.getPlugins = getPlugins;
// Plugins list
function connect(projectId, options) {
    if (options == null)
        options = {};
    if (options.reconnection == null)
        options.reconnection = false;
    const namespace = (projectId != null) ? `project:${projectId}` : "hub";
    const socket = io.connect(`${window.location.protocol}//${window.location.host}/${namespace}`, { transports: ["websocket"], reconnection: options.reconnection });
    socket.on("welcome", (clientId, config) => {
        SupCore.system.id = config.systemId;
    });
    return socket;
}
exports.connect = connect;
function onAssetTrashed() {
    document.body.innerHTML = "";
    const h1 = document.createElement("h1");
    h1.textContent = "This asset has been trashed.";
    const div = document.createElement("div");
    div.className = "ValjangEngine-error";
    div.appendChild(h1);
    document.body.appendChild(div);
}
exports.onAssetTrashed = onAssetTrashed;
function onDisconnected() {
    document.body.innerHTML = "";
    const h1 = document.createElement("h1");
    h1.textContent = "You were disconnected.";
    const button = document.createElement("button");
    button.textContent = "Reconnect";
    button.addEventListener("click", () => { location.reload(); });
    const div = document.createElement("div");
    div.className = "ValjangEngine-error";
    div.appendChild(h1);
    div.appendChild(button);
    document.body.appendChild(div);
}
exports.onDisconnected = onDisconnected;
function getTreeViewInsertionPoint(treeView) {
    let selectedElt = treeView.selectedNodes[0];
    let parentId;
    let index;
    if (selectedElt != null) {
        if (selectedElt.classList.contains("group")) {
            parentId = selectedElt.dataset["id"];
        }
        else {
            if (selectedElt.parentElement.classList.contains("children")) {
                parentId = selectedElt.parentElement.previousElementSibling != null ? selectedElt.parentElement.previousElementSibling.dataset["id"] : null;
            }
            index = 1;
            while (selectedElt.previousElementSibling != null) {
                selectedElt = selectedElt.previousElementSibling;
                if (selectedElt.tagName === "LI")
                    index++;
            }
        }
    }
    return { parentId, index };
}
exports.getTreeViewInsertionPoint = getTreeViewInsertionPoint;
function getTreeViewSiblingInsertionPoint(treeView) {
    let selectedElt = treeView.selectedNodes[0];
    const parentId = selectedElt.parentElement.previousElementSibling != null ? selectedElt.parentElement.previousElementSibling.dataset["id"] : null;
    let index = 1;
    while (selectedElt.previousElementSibling != null) {
        selectedElt = selectedElt.previousElementSibling;
        if (selectedElt.tagName === "LI")
            index++;
    }
    return { parentId, index };
}
exports.getTreeViewSiblingInsertionPoint = getTreeViewSiblingInsertionPoint;
function getTreeViewDropPoint(dropLocation, treeById) {
    let parentId;
    let index;
    let parentNode;
    const targetEntryId = dropLocation.target.dataset["id"];
    switch (dropLocation.where) {
        case "inside":
            {
                if (targetEntryId != null) {
                    parentNode = treeById.byId[targetEntryId];
                    index = parentNode.children.length;
                }
                else {
                    index = 0;
                }
            }
            break;
        case "above":
        case "below":
            {
                const targetNode = treeById.byId[targetEntryId];
                parentNode = treeById.parentNodesById[targetNode.id];
                index = (parentNode != null) ? parentNode.children.indexOf(targetNode) : treeById.pub.indexOf(targetNode);
                if (dropLocation.where === "below")
                    index++;
            }
            break;
    }
    if (parentNode != null)
        parentId = parentNode.id;
    return { parentId, index };
}
exports.getTreeViewDropPoint = getTreeViewDropPoint;
function getListViewDropIndex(dropLocation, listById, reversed = false) {
    const targetEntryId = dropLocation.target.dataset["id"];
    const targetNode = listById.byId[targetEntryId];
    let index = listById.pub.indexOf(targetNode);
    if (!reversed && dropLocation.where === "below")
        index++;
    if (reversed && dropLocation.where === "above")
        index++;
    return index;
}
exports.getListViewDropIndex = getListViewDropIndex;
function findEntryByPath(entries, path) {
    const parts = (typeof path === "string") ? path.split("/") : path;
    let foundEntry;
    entries.every((entry) => {
        if (entry.name === parts[0]) {
            if (parts.length === 1) {
                foundEntry = entry;
                return false;
            }
            if (entry.children == null)
                return true;
            foundEntry = findEntryByPath(entry.children, parts.slice(1));
            return false;
        }
        else
            return true;
    });
    return foundEntry;
}
exports.findEntryByPath = findEntryByPath;
function openEntry(entryId, state) {
    window.parent.postMessage({ type: "openEntry", id: entryId, state }, window.location.origin);
}
exports.openEntry = openEntry;
function setEntryRevisionDisabled(disabled) {
    window.parent.postMessage({ type: "setEntryRevisionDisabled", id: exports.query.asset, disabled }, window.location.origin);
}
exports.setEntryRevisionDisabled = setEntryRevisionDisabled;
function setupCollapsablePane(paneElt, refreshCallback) {
    const handle = new ResizeHandle(paneElt, "bottom");
    if (refreshCallback != null)
        handle.on("drag", () => { refreshCallback(); });
    const statusElt = paneElt.querySelector(".header");
    const buttonElt = document.createElement("button");
    buttonElt.classList.add("toggle");
    statusElt.appendChild(buttonElt);
    const contentElt = paneElt.querySelector(".content");
    const collaspe = (collapsed) => {
        contentElt.hidden = collapsed;
        buttonElt.textContent = collapsed ? "+" : "–";
        if (refreshCallback != null)
            refreshCallback();
    };
    collaspe(paneElt.classList.contains("collapsed"));
    statusElt.addEventListener("click", (event) => { collaspe(paneElt.classList.toggle("collapsed")); });
}
exports.setupCollapsablePane = setupCollapsablePane;
