"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const async = require("async");
document.addEventListener("keydown", (event) => {
    // F12
    if (event.keyCode === 123)
        SupApp.getCurrentWindow().webContents.toggleDevTools();
});
let socket;
SupApp.onMessage("build", (buildSetup, projectWindowId) => {
    socket = SupClient.connect(SupClient.query.project);
    socket.on("welcome", (clientId, config) => {
        loadPlugins(buildSetup, () => {
            const buildPlugin = SupClient.getPlugins("build")[buildSetup.buildPluginName];
            buildPlugin.content.build(socket, buildSetup.settings, projectWindowId, config.buildPort);
        });
    });
});
const detailsContainer = document.querySelector(".details");
const toggleDetailsButton = document.querySelector("button.toggle-details");
toggleDetailsButton.addEventListener("click", () => {
    detailsContainer.hidden = !detailsContainer.hidden;
    toggleDetailsButton.textContent = SupClient.i18n.t("build:" + (detailsContainer.hidden ? "showDetails" : "hideDetails"));
    SupApp.getCurrentWindow().setContentSize(SupApp.getCurrentWindow().getContentSize()[0], detailsContainer.hidden ? 150 : 350);
});
function loadPlugins(buildSetup, callback) {
    const i18nFiles = [];
    i18nFiles.push({ root: "/", name: "build" });
    i18nFiles.push({ root: buildSetup.pluginPath, name: "builds" });
    SupClient.fetch(`/systems/${SupCore.system.id}/plugins.json`, "json", (err, pluginsInfo) => {
        SupCore.system.pluginsInfo = pluginsInfo;
        async.parallel([
            (cb) => {
                SupClient.i18n.load(i18nFiles, cb);
            }, (cb) => {
                async.each(pluginsInfo.list, (pluginName, cb) => {
                    const pluginPath = `/systems/${SupCore.system.id}/plugins/${pluginName}`;
                    SupClient.loadScript(`${pluginPath}/bundles/build.js`, cb);
                }, cb);
            }
        ], () => {
            document.querySelector("header").textContent = SupClient.i18n.t(`builds:${buildSetup.buildPluginName}.title`);
            callback();
        });
    });
}
