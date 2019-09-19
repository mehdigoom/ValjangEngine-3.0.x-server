"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const async = require("async");
const entriesTreeView = require("./sidebar/entriesTreeView");
const sidebar = require("./sidebar");
const tabs = require("./tabs");
const tabsAssets = require("./tabs/assets");
const tabsTools = require("./tabs/tools");
function connect() {
    exports.socket = SupClient.connect(SupClient.query.project, { reconnection: true });
    exports.socket.on("error", onConnectionError);
    exports.socket.on("disconnect", onDisconnected);
    exports.socket.on("welcome", onWelcome);
    exports.socket.on("setProperty:manifest", onSetManifestProperty);
    exports.socket.on("updateIcon:manifest", onUpdateProjectIcon);
    exports.socket.on("add:entries", onEntryAdded);
    exports.socket.on("move:entries", onEntryMoved);
    exports.socket.on("trash:entries", onEntryTrashed);
    exports.socket.on("setProperty:entries", onSetEntryProperty);
    exports.socket.on("save:entries", onEntrySaved);
    exports.socket.on("set:badges", onBadgeSet);
    exports.socket.on("clear:badges", onBadgeCleared);
    exports.socket.on("add:dependencies", onDependenciesAdded);
    exports.socket.on("remove:dependencies", onDependenciesRemoved);
}
exports.connect = connect;
function onConnectionError() {
    const redirect = encodeURIComponent(`${window.location.pathname}${window.location.search}`);
    window.location.replace(`/login?redirect=${redirect}`);
}
function onDisconnected() {
    SupClient.Dialogs.cancelDialogIfAny();
    exports.entries = null;
    sidebar.disable();
}
function onWelcome(clientId, config) {
    exports.supportsServerBuild = config.supportsServerBuild;
    exports.buildPort = config.buildPort;
    SupClient.fetch(`/systems/${SupCore.system.id}/plugins.json`, "json", (err, thePluginsInfo) => {
        exports.pluginsInfo = thePluginsInfo;
        loadPluginLocales(exports.pluginsInfo.list, () => {
            async.parallel([
                (cb) => { tabsAssets.setup(exports.pluginsInfo.paths.editors, cb); },
                (cb) => { tabsTools.setup(exports.pluginsInfo.paths.tools, cb); }
            ], (err) => {
                if (err)
                    throw err;
                exports.socket.emit("sub", "manifest", null, onManifestReceived);
                exports.socket.emit("sub", "entries", null, onEntriesReceived);
            });
        });
    });
}
function loadPluginLocales(pluginsPaths, cb) {
    const localeFiles = [];
    const pluginsRoot = `/systems/${SupCore.system.id}/plugins`;
    for (const pluginPath of pluginsPaths) {
        localeFiles.push({ root: `${pluginsRoot}/${pluginPath}`, name: "plugin", context: pluginPath });
        localeFiles.push({ root: `${pluginsRoot}/${pluginPath}`, name: "badges" });
    }
    SupClient.i18n.load(localeFiles, cb);
}
function onManifestReceived(err, manifestPub) {
    exports.manifest = new SupCore.Data.ProjectManifest(manifestPub);
    document.querySelector(".project-name").textContent = manifestPub.name;
    document.title = `${manifestPub.name} — ValjangEngine`;
}
function onEntriesReceived(err, entriesPub, nextEntryId) {
    exports.entries = new SupCore.Data.Entries(entriesPub, nextEntryId);
    sidebar.enable();
    if (SupClient.query.asset != null)
        tabsAssets.open(SupClient.query.asset);
    else if (SupClient.query["tool"] != null)
        tabsTools.open(SupClient.query["tool"]);
}
function onSetManifestProperty(key, value) {
    exports.manifest.client_setProperty(key, value);
    switch (key) {
        case "name":
            document.title = `${value} — ValjangEngine`;
            document.querySelector(".project-name").textContent = value;
            break;
    }
}
function onUpdateProjectIcon() {
    // TODO: Update favicon?
}
function onEntryAdded(entry, parentId, index) {
    exports.entries.client_add(entry, parentId, index);
    const liElt = entriesTreeView.createEntryElement(entry);
    const nodeType = (entry.children != null) ? "group" : "item";
    let parentElt;
    if (parentId != null) {
        parentElt = entriesTreeView.widget.treeRoot.querySelector(`[data-id='${parentId}']`);
        const parentEntry = exports.entries.byId[parentId];
        const childrenElt = parentElt.querySelector("span.children");
        childrenElt.textContent = `(${parentEntry.children.length})`;
    }
    entriesTreeView.widget.insertAt(liElt, nodeType, index, parentElt);
}
function onEntryMoved(id, parentId, index) {
    exports.entries.client_move(id, parentId, index);
    const entryElt = entriesTreeView.widget.treeRoot.querySelector(`[data-id='${id}']`);
    const oldParentId = entryElt.dataset["parentId"];
    if (oldParentId != null) {
        const oldParentElt = entriesTreeView.widget.treeRoot.querySelector(`[data-id='${oldParentId}']`);
        const parentEntry = exports.entries.byId[oldParentId];
        const childrenElt = oldParentElt.querySelector("span.children");
        childrenElt.textContent = `(${parentEntry.children.length})`;
    }
    const nodeType = (entryElt.classList.contains("group")) ? "group" : "item";
    let parentElt;
    if (parentId != null) {
        parentElt = entriesTreeView.widget.treeRoot.querySelector(`[data-id='${parentId}']`);
        const parentEntry = exports.entries.byId[parentId];
        const childrenElt = parentElt.querySelector("span.children");
        childrenElt.textContent = `(${parentEntry.children.length})`;
    }
    entriesTreeView.widget.insertAt(entryElt, nodeType, index, parentElt);
    if (parentId != null)
        entryElt.dataset["parentId"] = parentId;
    else
        delete entryElt.dataset["parentId"];
    tabsAssets.refreshTabElement(exports.entries.byId[id]);
}
function onEntryTrashed(id) {
    exports.entries.client_remove(id);
    const entryElt = entriesTreeView.widget.treeRoot.querySelector(`[data-id='${id}']`);
    const oldParentId = entryElt.dataset["parentId"];
    if (oldParentId != null) {
        const oldParentElt = entriesTreeView.widget.treeRoot.querySelector(`[data-id='${oldParentId}']`);
        const parentEntry = exports.entries.byId[oldParentId];
        const childrenElt = oldParentElt.querySelector("span.children");
        childrenElt.textContent = `(${parentEntry.children.length})`;
    }
    entriesTreeView.widget.remove(entryElt);
}
function onSetEntryProperty(id, key, value) {
    exports.entries.client_setProperty(id, key, value);
    const entryElt = entriesTreeView.widget.treeRoot.querySelector(`[data-id='${id}']`);
    switch (key) {
        case "name":
            entryElt.querySelector(".name").textContent = value;
            const walk = (entry) => {
                tabsAssets.refreshTabElement(entry);
                if (entry.children != null)
                    for (const child of entry.children)
                        walk(child);
            };
            walk(exports.entries.byId[id]);
            break;
    }
}
function onEntrySaved(id, revisionId, revisionName) {
    exports.entries.client_save(id, revisionId, revisionName);
    const revisionPaneElt = tabs.panesElt.querySelector(`[data-asset-id='${id}'] .revision-inner-container`);
    if (revisionPaneElt == null)
        return;
    const revisions = exports.entries.byId[id].revisions;
    const selectElt = revisionPaneElt.querySelector("select");
    const optionElt = SupClient.html("option", { textContent: revisionName, value: revisionId });
    if (revisions.length === 1) {
        selectElt.appendChild(optionElt);
    }
    else {
        const previousRevisionId = revisions[revisions.length - 2].id;
        const previousRevisionElt = selectElt.querySelector(`option[value='${previousRevisionId}']`);
        selectElt.insertBefore(optionElt, previousRevisionElt);
    }
}
function onBadgeSet(id, newBadge) {
    const badges = exports.entries.badgesByEntryId[id];
    const existingBadge = badges.byId[newBadge.id];
    if (existingBadge != null) {
        existingBadge.type = newBadge.type;
        existingBadge.data = newBadge.data;
    }
    else
        badges.client_add(newBadge, null);
    const badgesElt = entriesTreeView.widget.treeRoot.querySelector(`[data-id='${id}'] .badges`);
    SupClient.html("span", newBadge.id, { parent: badgesElt, textContent: SupClient.i18n.t(`badges:${newBadge.id}`) });
}
function onBadgeCleared(id, badgeId) {
    const badges = exports.entries.badgesByEntryId[id];
    badges.client_remove(badgeId);
    const badgeElt = entriesTreeView.widget.treeRoot.querySelector(`[data-id='${id}'] .badges .${badgeId}`);
    badgeElt.parentElement.removeChild(badgeElt);
}
function onDependenciesAdded(id, depIds) {
    for (const depId of depIds)
        exports.entries.byId[depId].dependentAssetIds.push(id);
}
function onDependenciesRemoved(id, depIds) {
    for (const depId of depIds) {
        const dependentAssetIds = exports.entries.byId[depId].dependentAssetIds;
        dependentAssetIds.splice(dependentAssetIds.indexOf(id), 1);
    }
}
