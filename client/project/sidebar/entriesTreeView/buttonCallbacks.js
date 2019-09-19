"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const network_1 = require("../../network");
const tabsAssets = require("../../tabs/assets");
const entriesTreeView = require("./");
const CreateAssetDialog_1 = require("./CreateAssetDialog");
let autoOpenAsset = true;
function onEntryAddedAck(err, id) {
    if (err != null) {
        new SupClient.Dialogs.InfoDialog(err);
        return;
    }
    entriesTreeView.widget.clearSelection();
    let entry = entriesTreeView.widget.treeRoot.querySelector(`li[data-id='${id}']`);
    entriesTreeView.widget.addToSelection(entry);
    entriesTreeView.updateSelectedEntry();
    if (autoOpenAsset)
        tabsAssets.open(id);
    if (network_1.entries.byId[id].type == null)
        entry.classList.remove("collapsed");
}
function onNewAssetClick() {
    new CreateAssetDialog_1.default(autoOpenAsset, (result) => {
        if (result == null)
            return;
        if (result.name === "")
            result.name = SupClient.i18n.t(`${tabsAssets.editorsByAssetType[result.type].pluginPath}:editors.${result.type}.title`);
        autoOpenAsset = result.open;
        network_1.socket.emit("add:entries", result.name, result.type, SupClient.getTreeViewInsertionPoint(entriesTreeView.widget), onEntryAddedAck);
    });
}
exports.onNewAssetClick = onNewAssetClick;
function onNewFolderClick() {
    const options = {
        header: SupClient.i18n.t("project:treeView.newFolder.title"),
        placeholder: SupClient.i18n.t("project:treeView.newFolder.placeholder"),
        initialValue: SupClient.i18n.t("project:treeView.newFolder.initialValue"),
        validationLabel: SupClient.i18n.t("common:actions.create"),
        pattern: SupClient.namePattern,
        title: SupClient.i18n.t("common:namePatternDescription")
    };
    new SupClient.Dialogs.PromptDialog(SupClient.i18n.t("project:treeView.newFolder.prompt"), options, (name) => {
        if (name == null)
            return;
        network_1.socket.emit("add:entries", name, null, SupClient.getTreeViewInsertionPoint(entriesTreeView.widget), onEntryAddedAck);
    });
}
exports.onNewFolderClick = onNewFolderClick;
function onRenameEntryClick() {
    if (entriesTreeView.widget.selectedNodes.length !== 1)
        return;
    const selectedNode = entriesTreeView.widget.selectedNodes[0];
    const entry = network_1.entries.byId[selectedNode.dataset["id"]];
    const options = {
        header: SupClient.i18n.t("common:actions.rename"),
        initialValue: entry.name,
        validationLabel: SupClient.i18n.t("common:actions.rename"),
        pattern: SupClient.namePattern,
        title: SupClient.i18n.t("common:namePatternDescription")
    };
    new SupClient.Dialogs.PromptDialog(SupClient.i18n.t("project:treeView.renamePrompt"), options, (newName) => {
        if (newName == null || newName === entry.name)
            return;
        network_1.socket.emit("setProperty:entries", entry.id, "name", newName, (err) => {
            if (err != null) {
                new SupClient.Dialogs.InfoDialog(err);
                return;
            }
        });
    });
}
exports.onRenameEntryClick = onRenameEntryClick;
function onDuplicateEntryClick() {
    if (entriesTreeView.widget.selectedNodes.length !== 1)
        return;
    const selectedNode = entriesTreeView.widget.selectedNodes[0];
    const entry = network_1.entries.byId[selectedNode.dataset["id"]];
    const options = {
        header: SupClient.i18n.t("common:actions.duplicate"),
        initialValue: entry.name,
        validationLabel: SupClient.i18n.t("common:actions.duplicate"),
        pattern: SupClient.namePattern,
        title: SupClient.i18n.t("common:namePatternDescription")
    };
    new SupClient.Dialogs.PromptDialog(SupClient.i18n.t("project:treeView.duplicatePrompt"), options, (newName) => {
        if (newName == null)
            return;
        const insertionPoint = entry.type == null ? SupClient.getTreeViewSiblingInsertionPoint(entriesTreeView.widget) : SupClient.getTreeViewInsertionPoint(entriesTreeView.widget);
        network_1.socket.emit("duplicate:entries", newName, entry.id, insertionPoint, onEntryAddedAck);
    });
}
exports.onDuplicateEntryClick = onDuplicateEntryClick;
function onTrashEntryClick() {
    if (entriesTreeView.widget.selectedNodes.length === 0)
        return;
    const selectedEntries = [];
    function checkNextEntry() {
        selectedEntries.splice(0, 1);
        if (selectedEntries.length === 0) {
            const confirmLabel = SupClient.i18n.t("project:treeView.trash.prompt");
            const options = {
                header: SupClient.i18n.t("project:treeView.trash.title"),
                validationLabel: SupClient.i18n.t("project:treeView.trash.title"),
                checkboxLabel: SupClient.i18n.t("project:treeView.trash.checkbox")
            };
            new SupClient.Dialogs.ConfirmDialog(confirmLabel, options, (confirm) => {
                if (!confirm)
                    return;
                for (const selectedNode of entriesTreeView.widget.selectedNodes) {
                    const entry = network_1.entries.byId[selectedNode.dataset["id"]];
                    network_1.socket.emit("trash:entries", entry.id, (err) => {
                        if (err != null) {
                            new SupClient.Dialogs.InfoDialog(err);
                            return;
                        }
                    });
                }
                entriesTreeView.widget.clearSelection();
            });
        }
        else
            warnBrokenDependency(selectedEntries[0]);
    }
    function warnBrokenDependency(entry) {
        if (entry.type == null)
            for (const entryChild of entry.children)
                selectedEntries.push(entryChild);
        if (entry.dependentAssetIds != null && entry.dependentAssetIds.length > 0) {
            const dependentAssetNames = [];
            for (const usingId of entry.dependentAssetIds)
                dependentAssetNames.push(network_1.entries.getPathFromId(usingId));
            const infoLabel = SupClient.i18n.t("project:treeView.trash.warnBrokenDependency", {
                entryName: network_1.entries.getPathFromId(entry.id), dependentEntryNames: dependentAssetNames.join(", ")
            });
            new SupClient.Dialogs.InfoDialog(infoLabel, null, () => { checkNextEntry(); });
        }
        else
            checkNextEntry();
    }
    for (const selectedNode of entriesTreeView.widget.selectedNodes)
        selectedEntries.push(network_1.entries.byId[selectedNode.dataset["id"]]);
    warnBrokenDependency(selectedEntries[0]);
}
exports.onTrashEntryClick = onTrashEntryClick;
const entriesFilterStrip = document.querySelector(".filter-buttons");
function setupFilterStrip() {
    const filterElt = entriesFilterStrip;
    filterElt.innerHTML = "";
    const toggleAllElt = SupClient.html("img", "toggle-all", { parent: filterElt, draggable: false });
    toggleAllElt.addEventListener("click", onToggleAllFilterClick);
    for (const assetType of tabsAssets.assetTypes) {
        const iconElt = SupClient.html("img", { parent: filterElt, dataset: { assetType }, draggable: false });
        iconElt.src = `/systems/${SupCore.system.id}/plugins/${tabsAssets.editorsByAssetType[assetType].pluginPath}/editors/${assetType}/icon.svg`;
        iconElt.addEventListener("click", onToggleAssetTypeFilterClick);
    }
}
exports.setupFilterStrip = setupFilterStrip;
function onToggleAssetTypeFilterClick(event) {
    const filterElt = event.target;
    const filtered = filterElt.classList.toggle("filtered");
    const assetType = filterElt.dataset["assetType"];
    const entryElts = entriesTreeView.widget.treeRoot.querySelectorAll(`[data-asset-type='${assetType}']`);
    for (const entryElt of entryElts)
        entryElt.hidden = filtered;
    let allAssetTypesFiltered = true;
    for (const assetType of tabsAssets.assetTypes) {
        const filtered = entriesFilterStrip.querySelector(`[data-asset-type='${assetType}']`).classList.contains("filtered");
        if (!filtered) {
            allAssetTypesFiltered = false;
            break;
        }
    }
    entriesFilterStrip.querySelector(`.toggle-all`).classList.toggle("filtered", allAssetTypesFiltered);
}
function onToggleAllFilterClick() {
    const enableAllFilters = !entriesFilterStrip.querySelector(".toggle-all").classList.contains("filtered");
    const filterElts = entriesFilterStrip.querySelectorAll("img");
    for (const filterElt of filterElts) {
        filterElt.classList.toggle("filtered", enableAllFilters);
        const assetType = filterElt.dataset["assetType"];
        const entryElts = entriesTreeView.widget.treeRoot.querySelectorAll(`[data-asset-type='${assetType}']`);
        for (const entryElt of entryElts)
            entryElt.hidden = enableAllFilters;
    }
}
function onToggleFilterStripClick() {
    entriesFilterStrip.hidden = !entriesFilterStrip.hidden;
    if (entriesFilterStrip.hidden) {
        const hiddenEntryElts = entriesTreeView.widget.treeRoot.querySelectorAll("li.item[hidden]");
        for (const hiddenEntryElt of hiddenEntryElts)
            hiddenEntryElt.hidden = false;
    }
    else {
        for (const assetType of tabsAssets.assetTypes) {
            const filtered = entriesFilterStrip.querySelector(`[data-asset-type='${assetType}']`).classList.contains("filtered");
            const entryElts = entriesTreeView.widget.treeRoot.querySelectorAll(`[data-asset-type='${assetType}']`);
            for (const entryElt of entryElts)
                entryElt.hidden = filtered;
        }
    }
}
exports.onToggleFilterStripClick = onToggleFilterStripClick;
function onSearchEntryDialog() {
    if (network_1.entries == null)
        return;
    new SupClient.Dialogs.FindAssetDialog(network_1.entries, tabsAssets.editorsByAssetType, (entryId) => {
        if (entryId == null)
            return;
        tabsAssets.open(entryId);
        entriesTreeView.widget.clearSelection();
        const entryElt = entriesTreeView.widget.treeRoot.querySelector(`[data-id='${entryId}']`);
        entriesTreeView.widget.addToSelection(entryElt);
        entriesTreeView.widget.scrollIntoView(entryElt);
    });
}
exports.onSearchEntryDialog = onSearchEntryDialog;
