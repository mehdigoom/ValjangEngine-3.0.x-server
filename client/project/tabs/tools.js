"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const async = require("async");
const sidebar = require("../sidebar");
const tabs = require("./");
const homeTab = require("./homeTab");
const toolsElt = document.querySelector(".sidebar .tools ul");
function setup(toolPaths, callback) {
    exports.toolsByName = {};
    const pluginsRoot = `/systems/${SupCore.system.id}/plugins`;
    async.each(Object.keys(toolPaths), (toolName, cb) => {
        const toolTitle = SupClient.i18n.t(`${toolPaths[toolName]}:editors.${toolName}.title`);
        const pluginPath = toolPaths[toolName];
        exports.toolsByName[toolName] = { title: toolTitle, pluginPath, pinned: false };
        SupClient.fetch(`${pluginsRoot}/${pluginPath}/editors/${toolName}/manifest.json`, "json", (err, toolManifest) => {
            if (err != null) {
                cb(err);
                return;
            }
            exports.toolsByName[toolName].pinned = toolManifest.pinned;
            cb();
        });
    }, (err) => {
        if (err != null) {
            callback(err);
            return;
        }
        toolsElt.innerHTML = "";
        const toolNames = Object.keys(exports.toolsByName);
        toolNames.sort((a, b) => exports.toolsByName[a].title.localeCompare(exports.toolsByName[b].title));
        for (const toolName of toolNames)
            setupTool(toolName);
        callback();
    });
}
exports.setup = setup;
function setupTool(toolName) {
    const tool = exports.toolsByName[toolName];
    if (tool.pinned && SupClient.query.asset == null && SupClient.query["tool"] == null) {
        open(toolName);
        return;
    }
    const toolElt = SupClient.html("li", { parent: toolsElt, dataset: { name: toolName } });
    toolElt.addEventListener("mouseenter", (event) => { event.target.appendChild(sidebar.openInNewWindowButton); });
    toolElt.addEventListener("mouseleave", (event) => {
        if (sidebar.openInNewWindowButton.parentElement != null)
            sidebar.openInNewWindowButton.parentElement.removeChild(sidebar.openInNewWindowButton);
    });
    const containerElt = SupClient.html("div", { parent: toolElt });
    SupClient.html("img", { parent: containerElt, src: `/systems/${SupCore.system.id}/plugins/${tool.pluginPath}/editors/${toolName}/icon.svg` });
    const nameSpanElt = SupClient.html("span", "name", { parent: containerElt, textContent: SupClient.i18n.t(`${tool.pluginPath}:editors.${toolName}.title`) });
    nameSpanElt.addEventListener("click", (event) => { open(event.target.parentElement.parentElement.dataset["name"]); });
}
function open(name, state) {
    let tab = tabs.tabStrip.tabsRoot.querySelector(`li[data-pane='${name}']`);
    if (tab == null) {
        const tool = exports.toolsByName[name];
        tab = createTabElement(name, tool);
        if (exports.toolsByName[name].pinned) {
            const toolElt = toolsElt.querySelector(`li[data-name="${name}"]`);
            if (toolElt != null)
                toolElt.parentElement.removeChild(toolElt);
            const firstUnpinnedTab = tabs.tabStrip.tabsRoot.querySelector("li:not(.pinned)");
            tabs.tabStrip.tabsRoot.insertBefore(tab, firstUnpinnedTab);
        }
        else {
            tabs.tabStrip.tabsRoot.appendChild(tab);
        }
        const paneElt = SupClient.html("div", "pane-container", { parent: tabs.panesElt, dataset: { name } });
        const src = `/systems/${SupCore.system.id}/plugins/${tool.pluginPath}/editors/${name}/?project=${SupClient.query.project}`;
        const iframe = SupClient.html("iframe", { parent: paneElt, src });
        if (state != null)
            iframe.addEventListener("load", () => { iframe.contentWindow.postMessage({ type: "setState", state }, window.location.origin); });
    }
    else if (state != null) {
        const iframe = tabs.panesElt.querySelector(`.pane-container[data-name='${name}'] iframe`);
        iframe.contentWindow.postMessage({ type: "setState", state }, window.location.origin);
    }
    tabs.onActivate(tab);
    if (name === "main")
        homeTab.setup(tab);
}
exports.open = open;
function createTabElement(toolName, tool) {
    const tabElt = SupClient.html("li", { dataset: { pane: toolName } });
    tabElt.classList.toggle("pinned", tool.pinned);
    const iconElt = SupClient.html("img", "icon", { parent: tabElt });
    iconElt.src = `/systems/${SupCore.system.id}/plugins/${tool.pluginPath}/editors/${toolName}/icon.svg`;
    if (!tool.pinned) {
        const tabLabel = SupClient.html("div", "label", { parent: tabElt });
        SupClient.html("div", "name", { parent: tabLabel, textContent: SupClient.i18n.t(`${tool.pluginPath}:editors.${toolName}.title`) });
        const closeButton = SupClient.html("button", "close", { parent: tabElt });
        closeButton.addEventListener("click", () => { tabs.onClose(tabElt); });
    }
    return tabElt;
}
