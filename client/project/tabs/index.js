"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TabStrip = require("tab-strip");
const tabsBarElt = document.querySelector(".tabs-bar");
exports.tabStrip = new TabStrip(tabsBarElt);
exports.panesElt = document.querySelector(".main .panes");
function start() {
    exports.tabStrip.on("activateTab", onActivate);
    exports.tabStrip.on("closeTab", onClose);
    // Prevent <iframe> panes from getting mouse event while dragging tabs
    function restorePanesMouseEvent(event) {
        exports.panesElt.style.pointerEvents = "";
        document.removeEventListener("mouseup", restorePanesMouseEvent);
    }
    tabsBarElt.addEventListener("mousedown", (event) => {
        exports.panesElt.style.pointerEvents = "none";
        document.addEventListener("mouseup", restorePanesMouseEvent);
    });
}
exports.start = start;
function onActivate(tabElement) {
    const activeTab = exports.tabStrip.tabsRoot.querySelector(".active");
    if (activeTab === tabElement)
        return;
    if (activeTab != null) {
        activeTab.classList.remove("active");
        const activePaneElt = exports.panesElt.querySelector(".pane-container.active");
        activePaneElt.classList.remove("active");
        const activeIframe = activePaneElt.querySelector("iframe");
        activeIframe.contentWindow.postMessage({ type: "deactivate" }, window.location.origin);
    }
    tabElement.classList.add("active");
    tabElement.classList.remove("unread");
    const assetId = tabElement.dataset["assetId"];
    let paneElt;
    if (assetId != null)
        paneElt = exports.panesElt.querySelector(`.pane-container[data-asset-id='${assetId}']`);
    else
        paneElt = exports.panesElt.querySelector(`.pane-container[data-name='${tabElement.dataset["pane"]}']`);
    paneElt.classList.add("active");
    const iframe = paneElt.querySelector("iframe");
    iframe.contentWindow.focus();
    iframe.contentWindow.postMessage({ type: "activate" }, window.location.origin);
}
exports.onActivate = onActivate;
function onClose(tabElement) {
    if (tabElement == null)
        tabElement = exports.tabStrip.tabsRoot.querySelector(".active");
    const assetId = tabElement.dataset["assetId"];
    let paneElt;
    if (assetId != null)
        paneElt = exports.panesElt.querySelector(`.pane-container[data-asset-id='${assetId}']`);
    else {
        if (tabElement.classList.contains("pinned"))
            return;
        paneElt = exports.panesElt.querySelector(`.pane-container[data-name='${tabElement.dataset["pane"]}']`);
    }
    if (tabElement.classList.contains("active")) {
        const activeTabElement = (tabElement.nextElementSibling != null) ? tabElement.nextElementSibling : tabElement.previousElementSibling;
        if (activeTabElement != null)
            onActivate(activeTabElement);
    }
    tabElement.parentElement.removeChild(tabElement);
    paneElt.parentElement.removeChild(paneElt);
}
exports.onClose = onClose;
function onActivatePrevious() {
    const activeTabElt = exports.tabStrip.tabsRoot.querySelector(".active");
    for (let tabIndex = 0; exports.tabStrip.tabsRoot.children.length; tabIndex++) {
        const tabElt = exports.tabStrip.tabsRoot.children[tabIndex];
        if (tabElt === activeTabElt) {
            const newTabIndex = (tabIndex === 0) ? exports.tabStrip.tabsRoot.children.length - 1 : tabIndex - 1;
            onActivate(exports.tabStrip.tabsRoot.children[newTabIndex]);
            return;
        }
    }
}
exports.onActivatePrevious = onActivatePrevious;
function onActivateNext() {
    const activeTabElt = exports.tabStrip.tabsRoot.querySelector(".active");
    for (let tabIndex = 0; exports.tabStrip.tabsRoot.children.length; tabIndex++) {
        const tabElt = exports.tabStrip.tabsRoot.children[tabIndex];
        if (tabElt === activeTabElt) {
            const newTabIndex = (tabIndex === exports.tabStrip.tabsRoot.children.length - 1) ? 0 : tabIndex + 1;
            onActivate(exports.tabStrip.tabsRoot.children[newTabIndex]);
            return;
        }
    }
}
exports.onActivateNext = onActivateNext;
