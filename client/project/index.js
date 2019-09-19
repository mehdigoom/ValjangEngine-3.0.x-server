"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const network = require("./network");
const sidebar = require("./sidebar");
const header = require("./sidebar/header");
const buttonCallbacks_1 = require("./sidebar/entriesTreeView/buttonCallbacks");
const tabs = require("./tabs");
const tabsAssets = require("./tabs/assets");
const tabsTools = require("./tabs/tools");
const homeTab = require("./tabs/homeTab");
function start() {
    document.body.hidden = false;
    // Development mode
    if (localStorage.getItem("ValjangEngine-dev-mode") != null) {
        const projectManagementDiv = document.querySelector(".project-management");
        projectManagementDiv.style.backgroundColor = "#37d";
        // According to http://stackoverflow.com/a/12747364/915914, window.onerror
        // should be used rather than window.addEventListener("error", ...);
        // to get all errors, including syntax errors.
        window.onerror = onWindowDevError;
    }
    // Global controls
    const toggleNotificationsButton = document.querySelector(".top .controls button.toggle-notifications");
    toggleNotificationsButton.addEventListener("click", onClickToggleNotifications);
    if (localStorage.getItem("ValjangEngine-disable-notifications") != null) {
        toggleNotificationsButton.classList.add("disabled");
        toggleNotificationsButton.title = SupClient.i18n.t("project:header.notifications.enable");
    }
    else {
        toggleNotificationsButton.classList.remove("disabled");
        toggleNotificationsButton.title = SupClient.i18n.t("project:header.notifications.disable");
    }
    sidebar.start();
    tabs.start();
    network.connect();
}
SupClient.i18n.load([{ root: "/", name: "project" }, { root: "/", name: "badges" }], start);
window.addEventListener("message", onMessage);
function onMessage(event) {
    switch (event.data.type) {
        case "chat":
            homeTab.onMessageChat(event.data.content);
            break;
        case "hotkey":
            onMessageHotKey(event.data.content);
            break;
        case "openEntry":
            tabsAssets.open(event.data.id, event.data.state);
            break;
        case "setEntryRevisionDisabled":
            tabsAssets.setRevisionDisabled(event.data.id, event.data.disabled);
            break;
        case "openTool":
            tabsTools.open(event.data.name, event.data.state);
            break;
        case "error":
            onWindowDevError();
            break;
        case "forwardKeyboardEventToActiveTab":
            onForwardKeyboardEventToActiveTab(event.data.eventType, event.data.ctrlKey, event.data.altKey, event.shiftKey, event.metaKey, event.data.keyCode);
            break;
    }
}
function onWindowDevError() {
    const projectManagementDiv = document.querySelector(".project-management");
    projectManagementDiv.style.backgroundColor = "#c42";
    return false;
}
function onMessageHotKey(action) {
    switch (action) {
        case "newAsset":
            buttonCallbacks_1.onNewAssetClick();
            break;
        case "newFolder":
            buttonCallbacks_1.onNewFolderClick();
            break;
        case "searchEntry":
            buttonCallbacks_1.onSearchEntryDialog();
            break;
        case "filter":
            buttonCallbacks_1.onToggleFilterStripClick();
            break;
        case "closeTab":
            tabs.onClose();
            break;
        case "previousTab":
            tabs.onActivatePrevious();
            break;
        case "nextTab":
            tabs.onActivateNext();
            break;
        case "run":
            header.runProject();
            break;
        case "debug":
            header.runProject({ debug: true });
            break;
        case "devtools":
            if (SupApp != null)
                SupApp.getCurrentWindow().webContents.toggleDevTools();
            break;
    }
}
function onClickToggleNotifications(event) {
    let notificationsDisabled = (localStorage.getItem("ValjangEngine-disable-notifications") != null) ? true : false;
    notificationsDisabled = !notificationsDisabled;
    if (!notificationsDisabled) {
        localStorage.removeItem("ValjangEngine-disable-notifications");
        event.target.classList.remove("disabled");
        event.target.title = SupClient.i18n.t("project:header.notifications.disable");
    }
    else {
        localStorage.setItem("ValjangEngine-disable-notifications", "true");
        event.target.classList.add("disabled");
        event.target.title = SupClient.i18n.t("project:header.notifications.enable");
    }
}
function onForwardKeyboardEventToActiveTab(eventType, ctrlKey, altKey, shiftKey, metaKey, keyCode) {
    const event = new KeyboardEvent(eventType, { ctrlKey, altKey, shiftKey, metaKey });
    Object.defineProperty(event, "keyCode", { value: keyCode });
    const activePaneElt = tabs.panesElt.querySelector(".pane-container.active");
    const activeIframe = activePaneElt.querySelector("iframe");
    activeIframe.contentDocument.dispatchEvent(event);
}
