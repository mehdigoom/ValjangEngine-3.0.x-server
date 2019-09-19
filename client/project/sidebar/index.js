"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ResizeHandle = require("resize-handle");
const entriesTreeView = require("./entriesTreeView");
const header = require("./header");
exports.openInNewWindowButton = SupClient.html("button", "open-in-new-window", { title: SupClient.i18n.t("project:treeView.openInNewWindow") });
function start() {
    const sidebarResizeHandle = new ResizeHandle(document.querySelector(".sidebar"), "left");
    if (SupClient.query.asset != null || SupClient.query["tool"] != null) {
        sidebarResizeHandle.handleElt.classList.add("collapsed");
        sidebarResizeHandle.targetElt.style.width = "0";
        sidebarResizeHandle.targetElt.style.display = "none";
    }
    header.start();
    entriesTreeView.start();
}
exports.start = start;
function enable() {
    header.enable();
    entriesTreeView.enable();
}
exports.enable = enable;
function disable() {
    header.disable();
    entriesTreeView.disable();
}
exports.disable = disable;
