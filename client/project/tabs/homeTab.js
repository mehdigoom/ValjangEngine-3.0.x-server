"use strict";
// FIXME: This shouldn't be directly on the client since it comes from a plugin?
Object.defineProperty(exports, "__esModule", { value: true });
const network_1 = require("../network");
const tabs = require("./");
let homeTab;
function setup(tab) {
    homeTab = tab;
}
exports.setup = setup;
function onMessageChat(message) {
    if (homeTab == null)
        return;
    const isHomeTabVisible = homeTab.classList.contains("active");
    if (isHomeTabVisible && !document.hidden)
        return;
    if (!isHomeTabVisible)
        homeTab.classList.add("unread");
    if (localStorage.getItem("ValjangEngine-disable-notifications") != null)
        return;
    function doNotification() {
        const title = SupClient.i18n.t("project:header.notifications.new", { projectName: network_1.manifest.pub.name });
        const notification = new window.Notification(title, { icon: "/images/icon.png", body: message });
        const closeTimeoutId = setTimeout(() => { notification.close(); }, 5000);
        notification.addEventListener("click", () => {
            window.focus();
            tabs.onActivate(homeTab);
            clearTimeout(closeTimeoutId);
            notification.close();
        });
    }
    if (window.Notification.permission === "granted")
        doNotification();
    else if (window.Notification.permission !== "denied") {
        window.Notification.requestPermission((status) => {
            window.Notification.permission = status;
            if (window.Notification.permission === "granted")
                doNotification();
        });
    }
}
exports.onMessageChat = onMessageChat;
