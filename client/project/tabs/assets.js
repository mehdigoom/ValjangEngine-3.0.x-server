"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const async = require("async");
const network_1 = require("../network");
const entriesTreeView = require("../sidebar/entriesTreeView");
const tabs = require("./");
function setup(editorPaths, callback) {
    exports.editorsByAssetType = {};
    const pluginsRoot = `/systems/${SupCore.system.id}/plugins`;
    async.each(Object.keys(editorPaths), (assetType, cb) => {
        const toolTitle = SupClient.i18n.t(`${editorPaths[assetType]}:editors.${assetType}.title`);
        const pluginPath = editorPaths[assetType];
        exports.editorsByAssetType[assetType] = { title: toolTitle, pluginPath, revision: false };
        SupClient.fetch(`${pluginsRoot}/${pluginPath}/editors/${assetType}/manifest.json`, "json", (err, editorManifest) => {
            if (err != null) {
                cb(err);
                return;
            }
            exports.editorsByAssetType[assetType].revision = editorManifest.revision;
            cb();
        });
    }, (err) => {
        if (err != null) {
            callback(err);
            return;
        }
        exports.assetTypes = Object.keys(editorPaths).sort((a, b) => exports.editorsByAssetType[a].title.localeCompare(exports.editorsByAssetType[b].title));
        callback();
    });
}
exports.setup = setup;
function open(id, state) {
    const entry = network_1.entries.byId[id];
    if (entry == null)
        return;
    // Just toggle folders
    if (entry.type == null) {
        entriesTreeView.widget.selectedNodes[0].classList.toggle("collapsed");
        return;
    }
    entriesTreeView.scrollEntryIntoView(id);
    let tab = tabs.tabStrip.tabsRoot.querySelector(`li[data-asset-id='${id}']`);
    if (tab == null) {
        tab = createTabElement(entry);
        tabs.tabStrip.tabsRoot.appendChild(tab);
        const paneElt = SupClient.html("div", "pane-container", { parent: tabs.panesElt, dataset: { assetId: id } });
        const revisionOuterContainer = SupClient.html("div", "revision-outer-container", { parent: paneElt, hidden: !exports.editorsByAssetType[entry.type].revision });
        const revisionInnerContainer = SupClient.html("div", "revision-inner-container", { parent: revisionOuterContainer });
        SupClient.html("span", { parent: revisionInnerContainer, textContent: SupClient.i18n.t("project:revision.title") });
        const selectElt = SupClient.html("select", { parent: revisionInnerContainer, disabled: true });
        SupClient.html("option", { parent: selectElt, textContent: SupClient.i18n.t("project:revision.current"), value: "current" });
        for (let revisionIndex = entry.revisions.length - 1; revisionIndex >= 0; revisionIndex--) {
            const revision = entry.revisions[revisionIndex];
            SupClient.html("option", { parent: selectElt, textContent: revision.name, value: revision.id });
        }
        const saveOrRestoreButtonElt = SupClient.html("button", { parent: revisionInnerContainer, textContent: SupClient.i18n.t("common:actions.save"), disabled: true });
        const src = `/systems/${SupCore.system.id}/plugins/${exports.editorsByAssetType[entry.type].pluginPath}/editors/${entry.type}/?project=${SupClient.query.project}&asset=${id}`;
        const iframe = SupClient.html("iframe", { parent: paneElt, src });
        if (state != null)
            iframe.addEventListener("load", () => { iframe.contentWindow.postMessage({ type: "setState", state }, window.location.origin); });
        selectElt.addEventListener("change", () => {
            saveOrRestoreButtonElt.textContent = SupClient.i18n.t(`common:actions.${selectElt.value === "current" ? "save" : "restore"}`);
            iframe.contentWindow.postMessage({ type: "setRevision", revisionId: selectElt.value }, window.location.origin);
        });
        saveOrRestoreButtonElt.addEventListener("click", () => {
            if (selectElt.value === "current") {
                const date = new Date();
                const defaultRevisionName = date.getUTCFullYear() + "-" +
                    `00${date.getUTCMonth() + 1}`.slice(-2) + "-" +
                    `00${date.getUTCDate()}`.slice(-2) + " " +
                    `00${date.getUTCHours()}`.slice(-2) + "-" +
                    `00${date.getUTCMinutes() + 1}`.slice(-2);
                const options = {
                    header: SupClient.i18n.t("project:revision.title"),
                    validationLabel: SupClient.i18n.t("common:actions.save"),
                    initialValue: defaultRevisionName,
                    title: SupClient.i18n.t("common:namePatternDescription"),
                    pattern: SupClient.namePattern
                };
                /* tslint:disable:no-unused-expression */
                new SupClient.Dialogs.PromptDialog(SupClient.i18n.t("project:revision.prompt"), options, (revisionName) => {
                    /* tslint:enable:no-unused-expression */
                    if (revisionName == null)
                        return;
                    network_1.socket.emit("save:entries", id, revisionName, (err) => {
                        if (err != null) {
                            /* tslint:disable:no-unused-expression */
                            new SupClient.Dialogs.InfoDialog(err);
                            /* tslint:enable:no-unused-expression */
                            return;
                        }
                    });
                });
            }
            else {
                selectElt.disabled = true;
                saveOrRestoreButtonElt.disabled = true;
                saveOrRestoreButtonElt.textContent = SupClient.i18n.t("project:revision.restoring");
                network_1.socket.emit("restore:assets", id, selectElt.value, (err) => {
                    if (err != null) {
                        /* tslint:disable:no-unused-expression */
                        new SupClient.Dialogs.InfoDialog(err);
                        /* tslint:enable:no-unused-expression */
                        return;
                    }
                    selectElt.disabled = false;
                    selectElt.value = "current";
                    saveOrRestoreButtonElt.disabled = false;
                    saveOrRestoreButtonElt.textContent = SupClient.i18n.t("common:actions.save");
                    iframe.contentWindow.postMessage({ type: "setRevision", revisionId: "restored" }, window.location.origin);
                });
            }
        });
    }
    else if (state != null) {
        const iframe = tabs.panesElt.querySelector(`[data-asset-id='${id}'] iframe`);
        iframe.contentWindow.postMessage({ type: "setState", state }, window.location.origin);
    }
    tabs.onActivate(tab);
    return tab;
}
exports.open = open;
function createTabElement(entry) {
    const tabElt = SupClient.html("li", { dataset: { assetId: entry.id } });
    if (entry.type != null) {
        const iconElt = SupClient.html("img", "icon", { parent: tabElt });
        iconElt.src = `/systems/${SupCore.system.id}/plugins/${exports.editorsByAssetType[entry.type].pluginPath}/editors/${entry.type}/icon.svg`;
        // FIXME: This event isn't emitted on the last opened tab in Chrome. Works fine in Firefox though
        tabElt.addEventListener("dblclick", () => { entriesTreeView.scrollEntryIntoView(entry.id); });
    }
    const tabLabel = SupClient.html("div", "label", { parent: tabElt });
    SupClient.html("div", "location", { parent: tabLabel });
    SupClient.html("div", "name", { parent: tabLabel });
    const closeButton = SupClient.html("button", "close", { parent: tabElt });
    closeButton.addEventListener("click", () => { tabs.onClose(tabElt); });
    refreshTabElement(entry, tabElt);
    return tabElt;
}
function refreshTabElement(entry, tabElt) {
    if (tabElt == null)
        tabElt = tabs.tabStrip.tabsRoot.querySelector(`li[data-asset-id='${entry.id}']`);
    if (tabElt == null)
        return;
    const entryPath = network_1.entries.getPathFromId(entry.id);
    const entryName = entry.name;
    const lastSlash = entryPath.lastIndexOf("/");
    let entryLocation = (lastSlash !== -1) ? entryPath.slice(0, lastSlash) : "";
    const maxEntryLocationLength = 20;
    while (entryLocation.length > maxEntryLocationLength) {
        const slashIndex = entryLocation.indexOf("/", 2);
        if (slashIndex === -1)
            break;
        entryLocation = `…/${entryLocation.slice(slashIndex + 1)}`;
    }
    tabElt.querySelector(".label .location").textContent = entryLocation;
    tabElt.querySelector(".label .name").textContent = entryName;
    tabElt.title = entryPath;
}
exports.refreshTabElement = refreshTabElement;
function setRevisionDisabled(id, disabled) {
    const revisionContainer = tabs.panesElt.querySelector(`[data-asset-id='${id}'] .revision-inner-container`);
    revisionContainer.querySelector("select").disabled = disabled;
    revisionContainer.querySelector("button").disabled = disabled;
}
exports.setRevisionDisabled = setRevisionDisabled;
