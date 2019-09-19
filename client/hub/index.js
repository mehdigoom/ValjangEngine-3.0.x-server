"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CreateOrEditProjectDialog_1 = require("./CreateOrEditProjectDialog");
const async = require("async");
const TreeView = require("dnd-tree-view");
const data = {};
const ui = {};
let socket;
const port = (window.location.port.length === 0) ? (window.location.protocol === "https" ? "443" : "80") : window.location.port;
const languageNamesById = {};
if (localStorage.getItem("ValjangEngine-dev-mode") != null)
    languageNamesById["none"] = "None";
function start() {
    ui.projectsTreeView = new TreeView(document.querySelector(".projects-tree-view"), { multipleSelection: false });
    ui.projectsTreeView.on("selectionChange", onProjectSelectionChange);
    ui.projectsTreeView.on("activate", onProjectActivate);
    document.querySelector(".projects-buttons .new-project").addEventListener("click", onNewProjectClick);
    document.querySelector(".projects-buttons .open-project").addEventListener("click", onProjectActivate);
    document.querySelector(".projects-buttons .edit-project").addEventListener("click", onEditProjectClick);
    const selectLanguageElt = document.querySelector("select.language");
    const languageIds = Object.keys(languageNamesById);
    languageIds.sort((a, b) => {
        // Always sort "None" at the end
        if (a === "none")
            return 1;
        if (b === "none")
            return -1;
        return languageNamesById[a].localeCompare(languageNamesById[b]);
    });
    for (const languageId of languageIds)
        SupClient.html("option", { parent: selectLanguageElt, value: languageId, textContent: languageNamesById[languageId] });
    selectLanguageElt.value = SupClient.cookies.get("supLanguage");
    document.querySelector("select.language").addEventListener("change", (event) => {
        SupClient.cookies.set("supLanguage", event.target.value, { expires: 7 });
        window.location.reload();
    });
    socket = SupClient.connect(null, { reconnection: true });
    socket.on("error", onConnectionError);
    socket.on("connect", onConnected);
    socket.on("hubWelcome", onHubWelcome);
    socket.on("disconnect", onDisconnected);
    socket.on("add:projects", onProjectAdded);
    socket.on("setProperty:projects", onSetProjectProperty);
    socket.on("updateIcon:projects", onUpdateProjectIcon);
}
const i18nFiles = [{ root: "/", name: "hub" }];
loadSystemsInfo(() => {
    async.each(SupClient.i18n.languageIds, (languageId, cb) => {
        SupClient.fetch(`/locales/${languageId}/common.json`, "json", (err, data) => {
            languageNamesById[languageId] = data.activeLanguage;
            cb();
        });
    }, () => {
        SupClient.i18n.load(i18nFiles, start);
    });
});
function loadSystemsInfo(callback) {
    data.systemsById = {};
    SupClient.fetch("/systems.json", "json", (err, systemsInfo) => {
        async.each(systemsInfo.list, (systemId, cb) => {
            i18nFiles.push({ root: `/systems/${systemId}`, name: "system", context: `system-${systemId}` });
            SupClient.fetch(`/systems/${systemId}/templates.json`, "json", (err, templatesList) => {
                for (const templateName of templatesList) {
                    i18nFiles.push({
                        root: `/systems/${systemId}/templates/${templateName}`,
                        name: "template",
                        context: `${systemId}-${templateName}`
                    });
                }
                data.systemsById[systemId] = templatesList;
                cb();
            });
        }, () => { callback(); });
    });
}
// Network callbacks
function onConnectionError() {
    window.location.replace("/login");
}
function onConnected() {
    socket.emit("sub", "projects", null, onProjectsReceived);
    const buttons = document.querySelectorAll(".projects-buttons button");
    buttons[0].disabled = false;
    const noSelection = ui.projectsTreeView.selectedNodes.length === 0;
    for (let i = 1; i < buttons.length; i++)
        buttons[i].disabled = noSelection;
}
function onHubWelcome(config) {
    let serverName = config.serverName;
    if (serverName == null)
        serverName = SupClient.i18n.t(`hub:serverAddress`, { hostname: window.location.hostname, port });
    document.querySelector(".server-name").textContent = serverName;
}
function onDisconnected() {
    SupClient.Dialogs.cancelDialogIfAny();
    data.projects = null;
    ui.projectsTreeView.clearSelection();
    ui.projectsTreeView.treeRoot.innerHTML = "";
    const buttons = document.querySelectorAll(".projects-buttons button");
    for (let i = 0; i < buttons.length; i++)
        buttons[i].disabled = true;
    document.querySelector(".tree-loading").hidden = false;
}
function onProjectsReceived(err, projects) {
    data.projects = new SupCore.Data.Projects(projects);
    ui.projectsTreeView.clearSelection();
    ui.projectsTreeView.treeRoot.innerHTML = "";
    for (const manifest of projects) {
        const liElt = createProjectElement(manifest);
        ui.projectsTreeView.append(liElt, "item");
    }
    document.querySelector(".tree-loading").hidden = true;
}
function onProjectAdded(manifest, index) {
    data.projects.client_add(manifest, index);
    const liElt = createProjectElement(manifest);
    ui.projectsTreeView.insertAt(liElt, "item", index);
}
function onSetProjectProperty(id, key, value) {
    data.projects.client_setProperty(id, key, value);
    const projectElt = ui.projectsTreeView.treeRoot.querySelector(`[data-id='${id}']`);
    switch (key) {
        case "name":
            projectElt.querySelector(".name").textContent = value;
            break;
        case "description":
            projectElt.querySelector(".description").textContent = value;
            break;
    }
}
function onUpdateProjectIcon(id) {
    const projectElt = ui.projectsTreeView.treeRoot.querySelector(`[data-id='${id}']`);
    const iconElt = projectElt.querySelector("img");
    iconElt.src = `/projects/${id}/icon.png?${Date.now()}`;
}
// User interface
function createProjectElement(manifest) {
    const liElt = SupClient.html("li", { dataset: { id: manifest.id } });
    SupClient.html("img", { parent: liElt, src: `/projects/${manifest.id}/icon.png` });
    const infoElt = SupClient.html("div", "info", { parent: liElt });
    SupClient.html("div", "name", { parent: infoElt, textContent: manifest.name });
    const detailsElt = SupClient.html("div", "details", { parent: infoElt });
    SupClient.html("span", "description", { parent: detailsElt, textContent: manifest.description });
    SupClient.html("span", "project-type", { parent: detailsElt, textContent: SupClient.i18n.t(`system-${manifest.systemId}:title`) });
    return liElt;
}
function onProjectSelectionChange() {
    const buttons = document.querySelectorAll(".projects-buttons button");
    buttons[0].disabled = false;
    const noSelection = ui.projectsTreeView.selectedNodes.length === 0;
    for (let i = 1; i < buttons.length; i++)
        buttons[i].disabled = noSelection;
}
function onProjectActivate() {
    const projectId = ui.projectsTreeView.selectedNodes[0].dataset["id"];
    const href = `/project/?project=${projectId}`;
    if (SupApp != null)
        SupApp.openWindow(`${window.location.origin}${href}`);
    else
        window.location.href = href;
}
let autoOpenProject = true;
function onNewProjectClick() {
    if (Object.keys(data.systemsById).length === 0) {
        new SupClient.Dialogs.InfoDialog(SupClient.i18n.t("hub:newProject.noSystemError.message"), { header: SupClient.i18n.t("hub:newProject.noSystemError.header") });
    }
    else {
        new CreateOrEditProjectDialog_1.default(data.systemsById, { autoOpen: autoOpenProject }, (result) => {
            if (result == null)
                return;
            autoOpenProject = result.open;
            socket.emit("add:projects", result.project, onProjectAddedAck);
        });
    }
}
function onProjectAddedAck(err, id) {
    if (err != null) {
        new SupClient.Dialogs.InfoDialog(err);
        return;
    }
    ui.projectsTreeView.clearSelection();
    const node = ui.projectsTreeView.treeRoot.querySelector(`li[data-id='${id}']`);
    ui.projectsTreeView.addToSelection(node);
    ui.projectsTreeView.scrollIntoView(node);
    if (autoOpenProject)
        onProjectActivate();
}
function onEditProjectClick() {
    if (ui.projectsTreeView.selectedNodes.length !== 1)
        return;
    const selectedNode = ui.projectsTreeView.selectedNodes[0];
    const existingProject = data.projects.byId[selectedNode.dataset["id"]];
    new CreateOrEditProjectDialog_1.default(data.systemsById, { existingProject }, (result) => {
        if (result == null)
            return;
        autoOpenProject = result.open;
        delete result.project.systemId;
        if (result.project.icon == null)
            delete result.project.icon;
        socket.emit("edit:projects", existingProject.id, result.project, (err) => {
            if (err != null) {
                new SupClient.Dialogs.InfoDialog(err);
                return;
            }
        });
    });
}
