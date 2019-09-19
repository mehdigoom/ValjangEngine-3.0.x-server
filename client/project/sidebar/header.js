"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const network_1 = require("../network");
const entriesTreeView = require("./entriesTreeView");
const StartBuildDialog_1 = require("./StartBuildDialog");
const projectButtons = document.querySelector(".project-buttons");
const runButton = projectButtons.querySelector(".run");
const debugButton = projectButtons.querySelector(".debug");
const stopButton = projectButtons.querySelector(".stop");
const buildButton = projectButtons.querySelector(".build");
function start() {
    if (SupClient.query.project == null)
        goToHub();
    document.querySelector(".project-icon .go-to-hub").addEventListener("click", () => { goToHub(); });
    buildButton.addEventListener("click", () => { openStartBuildDialog(); });
    runButton.addEventListener("click", () => { runProject(); });
    debugButton.addEventListener("click", () => { runProject({ debug: true }); });
    stopButton.addEventListener("click", () => { stopProject(); });
    if (SupApp == null)
        buildButton.title = SupClient.i18n.t("project:header.buildDisabled");
}
exports.start = start;
function enable() {
    runButton.hidden = !network_1.supportsServerBuild;
    debugButton.hidden = !network_1.supportsServerBuild || SupApp == null;
    stopButton.hidden = !network_1.supportsServerBuild || SupApp == null;
    projectButtons.hidden = false;
    runButton.disabled = false;
    debugButton.disabled = false;
    buildButton.disabled = SupApp == null;
}
exports.enable = enable;
function disable() {
    runButton.disabled = true;
    debugButton.disabled = true;
    buildButton.disabled = true;
}
exports.disable = disable;
function goToHub() {
    if (SupApp != null)
        SupApp.showMainWindow();
    else
        window.location.replace("/");
}
let runWindow;
let runWindowDestroyTimeout;
if (SupApp != null) {
    window.addEventListener("beforeunload", () => {
        if (runWindow != null)
            runWindow.removeListener("closed", onCloseRunWindow);
    });
}
function runProject(options = { debug: false }) {
    if (runButton.hidden || runButton.disabled)
        return;
    if (SupApp != null) {
        if (runWindow == null) {
            runWindow = SupApp.openWindow(`${window.location.origin}/serverBuild`);
            runWindow.setMenuBarVisibility(false);
            runWindow.on("closed", onCloseRunWindow);
            document.querySelector(".project-buttons").classList.toggle("running", true);
        }
        runWindow.show();
        runWindow.focus();
        stopButton.disabled = false;
    }
    else
        window.open("/serverBuild", `player_${SupClient.query.project}`);
    network_1.socket.emit("build:project", (err, buildId) => {
        if (err != null) {
            new SupClient.Dialogs.InfoDialog(err);
            return;
        }
        let url = `${window.location.protocol}//${window.location.hostname}:${network_1.buildPort}/systems/${SupCore.system.id}/?project=${SupClient.query.project}&build=${buildId}`;
        if (options.debug)
            url += "&debug";
        if (SupApp != null) {
            if (runWindow != null)
                runWindow.loadURL(url);
        }
        else
            window.open(url, `player_${SupClient.query.project}`);
    });
}
exports.runProject = runProject;
function onCloseRunWindow() {
    runWindow = null;
    if (runWindowDestroyTimeout != null) {
        clearTimeout(runWindowDestroyTimeout);
        runWindowDestroyTimeout = null;
    }
    stopButton.disabled = true;
}
function stopProject() {
    stopButton.disabled = true;
    // Send a message to ask the window to exit gracefully
    // So that it has a chance to clean things up
    runWindow.webContents.send("sup-app-message-force-quit");
    // If it doesn't, destroy it
    runWindowDestroyTimeout = setTimeout(destroyRunWindow, 500);
}
function destroyRunWindow() {
    runWindowDestroyTimeout = null;
    if (runWindow != null) {
        runWindow.destroy();
        runWindow = null;
    }
}
let buildWindow;
if (SupApp != null)
    SupApp.onMessage("build-finished", () => { buildButton.disabled = false; });
function openStartBuildDialog() {
    new StartBuildDialog_1.default(network_1.entries, entriesTreeView.widget, (buildSetup) => {
        if (buildSetup == null)
            return;
        if (buildWindow != null) {
            buildWindow.removeListener("closed", onCloseBuildWindow);
            buildWindow.close();
            buildWindow = null;
        }
        buildWindow = SupApp.openWindow(`${window.location.origin}/build/?project=${SupClient.query.project}`, { size: { width: 600, height: 150 }, resizable: false });
        buildWindow.on("closed", onCloseBuildWindow);
        buildButton.disabled = true;
        buildWindow.webContents.addListener("did-finish-load", () => { buildWindow.webContents.send("sup-app-message-build", buildSetup, SupApp.getCurrentWindow().id); });
    });
}
function onCloseBuildWindow() {
    buildWindow = null;
    buildButton.disabled = false;
}
