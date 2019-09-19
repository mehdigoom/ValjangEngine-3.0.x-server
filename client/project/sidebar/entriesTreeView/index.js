"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TreeView = require("dnd-tree-view");
const network_1 = require("../../network");
const tabsAssets = require("../../tabs/assets");
const sidebar = require("../");
const buttonCallbacks_1 = require("./buttonCallbacks");
function start() {
    exports.widget = new TreeView(document.querySelector(".entries-tree-view"), { dragStartCallback: onEntryDragStart, dropCallback: onTreeViewDrop });
    exports.widget.on("selectionChange", updateSelectedEntry);
    exports.widget.on("activate", onEntryActivate);
    document.querySelector(".entries-buttons .new-asset").addEventListener("click", buttonCallbacks_1.onNewAssetClick);
    document.querySelector(".entries-buttons .new-folder").addEventListener("click", buttonCallbacks_1.onNewFolderClick);
    document.querySelector(".entries-buttons .search").addEventListener("click", buttonCallbacks_1.onSearchEntryDialog);
    document.querySelector(".entries-buttons .rename-entry").addEventListener("click", buttonCallbacks_1.onRenameEntryClick);
    document.querySelector(".entries-buttons .duplicate-entry").addEventListener("click", buttonCallbacks_1.onDuplicateEntryClick);
    document.querySelector(".entries-buttons .trash-entry").addEventListener("click", buttonCallbacks_1.onTrashEntryClick);
    document.querySelector(".entries-buttons .filter").addEventListener("click", buttonCallbacks_1.onToggleFilterStripClick);
    sidebar.openInNewWindowButton.addEventListener("click", onOpenInNewWindowClick);
    // Hot-keys
    exports.widget.treeRoot.addEventListener("keydown", (event) => {
        if (document.querySelector(".dialog") != null)
            return;
        if (event.keyCode === 113) { // F2
            event.preventDefault();
            buttonCallbacks_1.onRenameEntryClick();
        }
        if (event.keyCode === 68 && (event.ctrlKey || event.metaKey)) { // Ctrl+D
            event.preventDefault();
            buttonCallbacks_1.onDuplicateEntryClick();
        }
        if (event.keyCode === 46) { // Delete
            event.preventDefault();
            buttonCallbacks_1.onTrashEntryClick();
        }
    });
}
exports.start = start;
function enable() {
    document.querySelector(".entries-buttons .new-asset").disabled = false;
    document.querySelector(".entries-buttons .new-folder").disabled = false;
    document.querySelector(".entries-buttons .search").disabled = false;
    document.querySelector(".entries-buttons .filter").disabled = false;
    document.querySelector(".filter-buttons").hidden = true;
    document.querySelector(".entries-tree-view .tree-loading").hidden = true;
    function walk(entry, parentEntry, parentElt) {
        const liElt = createEntryElement(entry);
        liElt.classList.add("collapsed");
        const nodeType = (entry.children != null) ? "group" : "item";
        exports.widget.append(liElt, nodeType, parentElt);
        if (entry.children != null)
            for (const child of entry.children)
                walk(child, entry, liElt);
    }
    for (const entry of network_1.entries.pub)
        walk(entry, null, null);
    buttonCallbacks_1.setupFilterStrip();
}
exports.enable = enable;
function disable() {
    exports.widget.clear();
    document.querySelector(".entries-buttons .new-asset").disabled = true;
    document.querySelector(".entries-buttons .new-folder").disabled = true;
    document.querySelector(".entries-buttons .search").disabled = true;
    document.querySelector(".entries-buttons .rename-entry").disabled = true;
    document.querySelector(".entries-buttons .duplicate-entry").disabled = true;
    document.querySelector(".entries-buttons .trash-entry").disabled = true;
    document.querySelector(".entries-buttons .filter").disabled = true;
    document.querySelector(".filter-buttons").hidden = true;
    document.querySelector(".entries-tree-view .tree-loading").hidden = false;
}
exports.disable = disable;
function createEntryElement(entry) {
    const liElt = SupClient.html("li", { dataset: { id: entry.id } });
    const parentEntry = network_1.entries.parentNodesById[entry.id];
    if (parentEntry != null)
        liElt.dataset["parentId"] = parentEntry.id;
    if (entry.type != null) {
        liElt.dataset["assetType"] = entry.type;
        const iconElt = SupClient.html("img", { parent: liElt, draggable: false });
        iconElt.src = `/systems/${SupCore.system.id}/plugins/${tabsAssets.editorsByAssetType[entry.type].pluginPath}/editors/${entry.type}/icon.svg`;
    }
    SupClient.html("span", "name", { parent: liElt, textContent: entry.name });
    if (entry.type != null) {
        const badgesSpan = SupClient.html("span", "badges", { parent: liElt });
        for (const badge of entry.badges)
            SupClient.html("span", badge.id, { parent: badgesSpan, textContent: SupClient.i18n.t(`badges:${badge.id}`) });
        liElt.addEventListener("mouseenter", (event) => { liElt.appendChild(sidebar.openInNewWindowButton); });
        liElt.addEventListener("mouseleave", (event) => {
            if (sidebar.openInNewWindowButton.parentElement != null)
                sidebar.openInNewWindowButton.parentElement.removeChild(sidebar.openInNewWindowButton);
        });
    }
    else {
        const childrenElt = SupClient.html("span", "children", { parent: liElt, textContent: `(${entry.children.length})`, style: { display: "none" } });
        liElt.addEventListener("mouseenter", (event) => { childrenElt.style.display = ""; });
        liElt.addEventListener("mouseleave", (event) => { childrenElt.style.display = "none"; });
    }
    return liElt;
}
exports.createEntryElement = createEntryElement;
function onEntryDragStart(event, entryElt) {
    const id = entryElt.dataset["id"];
    event.dataTransfer.setData("text/plain", network_1.entries.getPathFromId(id));
    const entryIds = [id];
    for (const node of exports.widget.selectedNodes) {
        if (node.dataset["id"] !== id)
            entryIds.push(node.dataset["id"]);
    }
    event.dataTransfer.setData("application/vnd.ValjangEngine.entry", entryIds.join(","));
    return true;
}
function onTreeViewDrop(event, dropLocation, orderedNodes) {
    if (orderedNodes == null) {
        // TODO: Support creating assets by importing some files
        return false;
    }
    const dropPoint = SupClient.getTreeViewDropPoint(dropLocation, network_1.entries);
    const entryIds = [];
    for (const entry of orderedNodes)
        entryIds.push(entry.dataset["id"]);
    const sourceParentNode = network_1.entries.parentNodesById[entryIds[0]];
    const sourceChildren = (sourceParentNode != null && sourceParentNode.children != null) ? sourceParentNode.children : network_1.entries.pub;
    const sameParent = (sourceParentNode != null && dropPoint.parentId === sourceParentNode.id);
    let i = 0;
    for (const id of entryIds) {
        network_1.socket.emit("move:entries", id, dropPoint.parentId, dropPoint.index + i, (err) => {
            if (err != null) {
                new SupClient.Dialogs.InfoDialog(err);
                return;
            }
        });
        if (!sameParent || sourceChildren.indexOf(network_1.entries.byId[id]) >= dropPoint.index)
            i++;
    }
    return false;
}
function updateSelectedEntry() {
    const allButtons = document.querySelectorAll(".entries-buttons button.edit");
    for (let index = 0; index < allButtons.length; index++) {
        const button = allButtons.item(index);
        button.disabled = exports.widget.selectedNodes.length === 0 || (button.classList.contains("single") && exports.widget.selectedNodes.length !== 1);
    }
}
exports.updateSelectedEntry = updateSelectedEntry;
function scrollEntryIntoView(entryId) {
    const entryElt = exports.widget.treeRoot.querySelector(`[data-id='${entryId}']`);
    exports.widget.clearSelection();
    exports.widget.scrollIntoView(entryElt);
    exports.widget.addToSelection(entryElt);
}
exports.scrollEntryIntoView = scrollEntryIntoView;
function onEntryActivate() {
    const activatedEntry = exports.widget.selectedNodes[0];
    tabsAssets.open(activatedEntry.dataset["id"]);
}
function onOpenInNewWindowClick(event) {
    const id = event.target.parentElement.dataset["id"];
    const name = event.target.parentElement.dataset["name"];
    let url;
    if (id != null)
        url = `${window.location.origin}/project/?project=${SupClient.query.project}&asset=${id}`;
    else
        url = `${window.location.origin}/project/?project=${SupClient.query.project}&tool=${name}`;
    if (SupApp != null)
        SupApp.openWindow(url);
    else
        window.open(url);
}
