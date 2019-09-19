"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const network_1 = require("./network");
const index_1 = require("./importers/index");
const ModelAsset_1 = require("../../data/ModelAsset");
const ResizeHandle = require("resize-handle");
const TreeView = require("dnd-tree-view");
const ui = {};
exports.default = ui;
// Setup resizable panes
new ResizeHandle(document.querySelector(".sidebar"), "right");
// Model upload
const modelFileSelect = document.querySelector(".model input.file-select");
modelFileSelect.addEventListener("change", onModelFileSelectChange);
document.querySelector(".model button.upload").addEventListener("click", () => { modelFileSelect.click(); });
// Primary map upload
const primaryMapFileSelect = document.querySelector(".map input.file-select");
primaryMapFileSelect.addEventListener("change", onPrimaryMapFileSelectChange);
ui.mapUploadButton = document.querySelector(".map button.upload");
ui.mapUploadButton.addEventListener("click", () => { primaryMapFileSelect.click(); });
ui.mapDownloadButton = document.querySelector(".map button.download");
ui.mapDownloadButton.addEventListener("click", () => {
    const textureName = network_1.data.modelUpdater.modelAsset.pub.mapSlots["map"];
    downloadTexture(textureName);
});
// Filtering
ui.filteringSelect = document.querySelector(".filtering");
ui.filteringSelect.addEventListener("change", onChangeFiltering);
// Wrapping
ui.wrappingSelect = document.querySelector(".wrapping");
ui.wrappingSelect.addEventListener("change", onChangeWrapping);
// Show skeleton
const showSkeletonCheckbox = document.querySelector(".show-skeleton");
showSkeletonCheckbox.addEventListener("change", onShowSkeletonChange);
// Unit Ratio
ui.unitRatioInput = document.querySelector("input.property-unitRatio");
ui.unitRatioInput.addEventListener("change", onChangeUnitRatio);
// Opacity
ui.opacitySelect = document.querySelector(".opacity-select");
ui.opacitySelect.addEventListener("change", onChangeOpacityType);
ui.opacitySlider = document.querySelector(".opacity-slider");
ui.opacitySlider.addEventListener("input", onChangeOpacity);
ui.opacityNumber = document.querySelector(".property-opacity");
ui.opacityNumber.addEventListener("input", onChangeOpacity);
// Animations
ui.animationsTreeView = new TreeView(document.querySelector(".animations-tree-view"), { dragStartCallback: () => true, dropCallback: onAnimationsTreeViewDrop });
ui.animationsTreeView.on("selectionChange", updateSelectedAnimation);
document.querySelector("button.new-animation").addEventListener("click", onNewAnimationClick);
// Animation upload
const animationFileSelect = document.querySelector(".upload-animation.file-select");
animationFileSelect.addEventListener("change", onAnimationFileSelectChange);
document.querySelector("button.upload-animation").addEventListener("click", () => { animationFileSelect.click(); });
document.querySelector("button.rename-animation").addEventListener("click", onRenameAnimationClick);
document.querySelector("button.delete-animation").addEventListener("click", onDeleteAnimationClick);
// Advanced textures
SupClient.setupCollapsablePane(document.querySelector(".advanced-textures"));
ui.texturesTreeView = new TreeView(document.querySelector(".textures-tree-view"));
ui.texturesTreeView.on("selectionChange", updateSelectedMap);
ui.mapSlotsInput = {};
for (const slotName in ModelAsset_1.default.schema["mapSlots"].properties) {
    ui.mapSlotsInput[slotName] = document.querySelector(`.map-${slotName}`);
    ui.mapSlotsInput[slotName].dataset["name"] = slotName;
    ui.mapSlotsInput[slotName].addEventListener("input", onEditMapSlot);
}
document.querySelector("button.new-map").addEventListener("click", onNewMapClick);
const mapFileSelect = document.querySelector(".upload-map.file-select");
mapFileSelect.addEventListener("change", onMapFileSelectChange);
document.querySelector("button.upload-map").addEventListener("click", () => { mapFileSelect.click(); });
document.querySelector("button.download-map").addEventListener("click", () => {
    if (ui.texturesTreeView.selectedNodes.length !== 1)
        return;
    const selectedNode = ui.texturesTreeView.selectedNodes[0];
    const textureName = selectedNode.dataset["name"];
    downloadTexture(textureName);
});
document.querySelector("button.rename-map").addEventListener("click", onRenameMapClick);
document.querySelector("button.delete-map").addEventListener("click", onDeleteMapClick);
// Error pane
ui.errorPane = document.querySelector(".error-pane");
ui.errorPaneStatus = ui.errorPane.querySelector(".header");
ui.errorPaneInfo = ui.errorPaneStatus.querySelector(".info");
ui.errorsTBody = ui.errorPane.querySelector(".content tbody");
SupClient.setupCollapsablePane(ui.errorPane);
function setImportLog(log) {
    let errorsCount = 0;
    let warningsCount = 0;
    let lastErrorRow = null;
    if (log == null)
        log = [];
    for (const entry of log) {
        // console.log(entry.file, entry.line, entry.type, entry.message);
        const logRow = document.createElement("tr");
        const positionCell = document.createElement("td");
        positionCell.textContent = (entry.line != null) ? (entry.line + 1).toString() : "";
        logRow.appendChild(positionCell);
        const typeCell = document.createElement("td");
        typeCell.textContent = entry.type;
        logRow.appendChild(typeCell);
        const messageCell = document.createElement("td");
        messageCell.textContent = entry.message;
        logRow.appendChild(messageCell);
        const fileCell = document.createElement("td");
        fileCell.textContent = entry.file;
        logRow.appendChild(fileCell);
        if (entry.type === "warning")
            warningsCount++;
        if (entry.type !== "error") {
            ui.errorsTBody.appendChild(logRow);
            continue;
        }
        ui.errorsTBody.insertBefore(logRow, (lastErrorRow != null) ? lastErrorRow.nextElementSibling : ui.errorsTBody.firstChild);
        lastErrorRow = logRow;
        errorsCount++;
    }
    const errorsAndWarningsInfo = [];
    if (errorsCount > 1)
        errorsAndWarningsInfo.push(`${errorsCount} errors`);
    else if (errorsCount > 0)
        errorsAndWarningsInfo.push(`1 error`);
    else
        errorsAndWarningsInfo.push("No errors");
    if (warningsCount > 1)
        errorsAndWarningsInfo.push(`${warningsCount} warnings`);
    else if (warningsCount > 0)
        errorsAndWarningsInfo.push(`${warningsCount} warnings`);
    if (network_1.data == null || errorsCount > 0) {
        const info = (network_1.data == null) ? `Import failed — ` : "";
        ui.errorPaneInfo.textContent = info + errorsAndWarningsInfo.join(", ");
        ui.errorPaneStatus.classList.add("has-errors");
        return;
    }
    ui.errorPaneInfo.textContent = errorsAndWarningsInfo.join(", ");
    ui.errorPaneStatus.classList.remove("has-errors");
}
function onModelFileSelectChange(event) {
    if (event.target.files.length === 0)
        return;
    ui.errorsTBody.innerHTML = "";
    index_1.default(event.target.files, (log, result) => {
        event.target.parentElement.reset();
        setImportLog(log);
        if (result != null) {
            network_1.data.projectClient.editAsset(SupClient.query.asset, "setModel", result.upAxisMatrix, result.attributes, result.bones);
            if (result.maps != null)
                network_1.data.projectClient.editAsset(SupClient.query.asset, "setMaps", result.maps);
        }
    });
}
function onPrimaryMapFileSelectChange(event) {
    ui.errorsTBody.innerHTML = "";
    ui.errorPaneInfo.textContent = "No errors";
    ui.errorPaneStatus.classList.remove("has-errors");
    const reader = new FileReader;
    const textureName = network_1.data.modelUpdater.modelAsset.pub.mapSlots["map"];
    const maps = {};
    reader.onload = (event) => {
        maps[textureName] = event.target.result;
        network_1.data.projectClient.editAsset(SupClient.query.asset, "setMaps", maps);
    };
    const element = event.target;
    reader.readAsArrayBuffer(element.files[0]);
    element.parentElement.reset();
    return;
}
function downloadTexture(textureName) {
    function triggerDownload(name) {
        const anchor = document.createElement("a");
        document.body.appendChild(anchor);
        anchor.style.display = "none";
        anchor.href = network_1.data.modelUpdater.modelAsset.mapObjectURLs[textureName];
        // Not yet supported in IE and Safari (http://caniuse.com/#feat=download)
        anchor.download = name + ".png";
        anchor.click();
        document.body.removeChild(anchor);
    }
    const options = {
        initialValue: SupClient.i18n.t("modelEditor:sidebar.advancedTextures.downloadInitialValue"),
        validationLabel: SupClient.i18n.t("common:actions.download")
    };
    if (SupApp != null) {
        triggerDownload(options.initialValue);
    }
    else {
        new SupClient.Dialogs.PromptDialog(SupClient.i18n.t("modelEditor:sidebar.advancedTextures.downloadPrompt"), options, (name) => {
            if (name == null)
                return;
            triggerDownload(name);
        });
    }
}
function onChangeFiltering(event) { network_1.data.projectClient.editAsset(SupClient.query.asset, "setProperty", "filtering", event.target.value); }
function onChangeWrapping(event) { network_1.data.projectClient.editAsset(SupClient.query.asset, "setProperty", "wrapping", event.target.value); }
function onShowSkeletonChange(event) { network_1.data.modelUpdater.modelRenderer.setShowSkeleton(event.target.checked); }
function onChangeUnitRatio(event) { network_1.data.projectClient.editAsset(SupClient.query.asset, "setProperty", "unitRatio", parseFloat(event.target.value)); }
function onChangeOpacityType(event) { network_1.data.projectClient.editAsset(SupClient.query.asset, "setProperty", "opacity", event.target.value === "transparent" ? 1 : null); }
function onChangeOpacity(event) {
    const opacity = parseFloat(event.target.value);
    if (isNaN(opacity))
        return;
    network_1.data.projectClient.editAsset(SupClient.query.asset, "setProperty", "opacity", opacity);
}
function onNewAnimationClick() {
    const options = {
        initialValue: SupClient.i18n.t("modelEditor:sidebar.animations.new.initialValue"),
        validationLabel: SupClient.i18n.t("common:actions.create")
    };
    new SupClient.Dialogs.PromptDialog(SupClient.i18n.t("modelEditor:sidebar.animations.new.prompt"), options, (name) => {
        if (name == null)
            return;
        network_1.data.projectClient.editAsset(SupClient.query.asset, "newAnimation", name, null, null, (animationId) => {
            ui.animationsTreeView.clearSelection();
            ui.animationsTreeView.addToSelection(ui.animationsTreeView.treeRoot.querySelector(`li[data-id="${animationId}"]`));
            updateSelectedAnimation();
        });
    });
}
function onAnimationFileSelectChange(event) {
    if (event.target.files.length === 0)
        return;
    const animationId = ui.selectedAnimationId;
    index_1.default(event.target.files, (log, result) => {
        event.target.parentElement.reset();
        setImportLog(log);
        if (network_1.data != null) {
            if (result.animation == null) {
                new SupClient.Dialogs.InfoDialog("No animation found in imported files");
                return;
            }
            // TODO: Check if bones are compatible
            network_1.data.projectClient.editAsset(SupClient.query.asset, "setAnimation", animationId, result.animation.duration, result.animation.keyFrames);
        }
    });
}
function onRenameAnimationClick() {
    if (ui.animationsTreeView.selectedNodes.length !== 1)
        return;
    const selectedNode = ui.animationsTreeView.selectedNodes[0];
    const animation = network_1.data.modelUpdater.modelAsset.animations.byId[selectedNode.dataset["id"]];
    const options = {
        initialValue: animation.name,
        validationLabel: SupClient.i18n.t("common:actions.rename")
    };
    new SupClient.Dialogs.PromptDialog(SupClient.i18n.t("modelEditor:sidebar.animations.renamePrompt"), options, (newName) => {
        if (newName == null)
            return;
        network_1.data.projectClient.editAsset(SupClient.query.asset, "setAnimationProperty", animation.id, "name", newName);
    });
}
function onDeleteAnimationClick() {
    if (ui.animationsTreeView.selectedNodes.length === 0)
        return;
    const confirmLabel = SupClient.i18n.t("modelEditor:sidebar.animations.deleteConfirm");
    const validationLabel = SupClient.i18n.t("common:actions.delete");
    new SupClient.Dialogs.ConfirmDialog(confirmLabel, { validationLabel }, (confirm) => {
        if (!confirm)
            return;
        for (const selectedNode of ui.animationsTreeView.selectedNodes)
            network_1.data.projectClient.editAsset(SupClient.query.asset, "deleteAnimation", selectedNode.dataset["id"]);
    });
}
function onAnimationsTreeViewDrop(event, dropLocation, orderedNodes) {
    const animationIds = [];
    for (const animation of orderedNodes)
        animationIds.push(animation.dataset["id"]);
    const index = SupClient.getListViewDropIndex(dropLocation, network_1.data.modelUpdater.modelAsset.animations);
    for (let i = 0; i < animationIds.length; i++)
        network_1.data.projectClient.editAsset(SupClient.query.asset, "moveAnimation", animationIds[i], index + i);
    return false;
}
function updateSelectedAnimation() {
    const selectedAnimElt = ui.animationsTreeView.selectedNodes[0];
    if (selectedAnimElt != null)
        ui.selectedAnimationId = selectedAnimElt.dataset["id"];
    else
        ui.selectedAnimationId = null;
    const buttons = document.querySelectorAll(".animations-buttons button");
    for (let i = 0; i < buttons.length; i++) {
        const button = buttons[i];
        button.disabled = ui.selectedAnimationId == null && button.className !== "new-animation";
    }
    network_1.data.modelUpdater.config_setProperty("animationId", ui.selectedAnimationId);
}
exports.updateSelectedAnimation = updateSelectedAnimation;
function setupAnimation(animation, index) {
    const liElt = document.createElement("li");
    liElt.dataset["id"] = animation.id;
    const nameSpan = document.createElement("span");
    nameSpan.className = "name";
    nameSpan.textContent = animation.name;
    liElt.appendChild(nameSpan);
    ui.animationsTreeView.insertAt(liElt, "item", index, null);
}
exports.setupAnimation = setupAnimation;
function onEditMapSlot(event) {
    if (event.target.value !== "" && network_1.data.modelUpdater.modelAsset.pub.maps[event.target.value] == null)
        return;
    const slot = event.target.value !== "" ? event.target.value : null;
    network_1.data.projectClient.editAsset(SupClient.query.asset, "setMapSlot", event.target.dataset["name"], slot);
}
function onNewMapClick() {
    const options = {
        initialValue: "map",
        validationLabel: SupClient.i18n.t("common:actions.create")
    };
    new SupClient.Dialogs.PromptDialog(SupClient.i18n.t("modelEditor:sidebar.advancedTextures.newMapPrompt"), options, (name) => {
        if (name == null)
            return;
        network_1.data.projectClient.editAsset(SupClient.query.asset, "newMap", name);
    });
}
function onMapFileSelectChange(event) {
    if (ui.texturesTreeView.selectedNodes.length !== 1)
        return;
    const textureName = ui.texturesTreeView.selectedNodes[0].dataset["name"];
    ui.errorsTBody.innerHTML = "";
    ui.errorPaneInfo.textContent = "No errors";
    ui.errorPaneStatus.classList.remove("has-errors");
    const reader = new FileReader;
    const maps = {};
    reader.onload = (event) => {
        maps[textureName] = event.target.result;
        network_1.data.projectClient.editAsset(SupClient.query.asset, "setMaps", maps);
    };
    const element = event.target;
    reader.readAsArrayBuffer(element.files[0]);
    element.parentElement.reset();
    return;
}
function onRenameMapClick() {
    if (ui.texturesTreeView.selectedNodes.length !== 1)
        return;
    const textureName = ui.texturesTreeView.selectedNodes[0].dataset["name"];
    const options = {
        initialValue: textureName,
        validationLabel: SupClient.i18n.t("common:actions.rename")
    };
    new SupClient.Dialogs.PromptDialog(SupClient.i18n.t("modelEditor:sidebar.advancedTextures.renameMapPrompt"), options, (newName) => {
        if (newName == null)
            return;
        network_1.data.projectClient.editAsset(SupClient.query.asset, "renameMap", textureName, newName);
    });
}
function onDeleteMapClick() {
    if (ui.texturesTreeView.selectedNodes.length === 0)
        return;
    const confirmLabel = SupClient.i18n.t("modelEditor:sidebar.advancedTextures.deleteMapConfirm");
    const validationLabel = SupClient.i18n.t("common:actions.delete");
    new SupClient.Dialogs.ConfirmDialog(confirmLabel, { validationLabel }, (confirmed) => {
        if (!confirmed)
            return;
        for (const selectedNode of ui.texturesTreeView.selectedNodes)
            network_1.data.projectClient.editAsset(SupClient.query.asset, "deleteMap", selectedNode.dataset["name"]);
    });
}
function updateSelectedMap() {
    const buttons = document.querySelectorAll(".textures-buttons button");
    for (let i = 0; i < buttons.length; i++) {
        const button = buttons[i];
        if (button.className === "new-map")
            continue;
        if (button.className === "delete-map")
            button.disabled = ui.texturesTreeView.selectedNodes.length === 0;
        else
            button.disabled = ui.texturesTreeView.selectedNodes.length !== 1;
    }
}
exports.updateSelectedMap = updateSelectedMap;
function setupMap(mapName) {
    const liElt = document.createElement("li");
    liElt.dataset["name"] = mapName;
    const nameSpan = document.createElement("span");
    nameSpan.className = "name";
    nameSpan.textContent = mapName;
    liElt.appendChild(nameSpan);
    ui.texturesTreeView.insertAt(liElt, "item", 0, null);
}
exports.setupMap = setupMap;
function setupOpacity(opacity) {
    if (opacity == null) {
        ui.opacitySelect.value = "opaque";
        ui.opacitySlider.parentElement.hidden = true;
        network_1.data.modelUpdater.modelRenderer.setOpacity(1);
    }
    else {
        ui.opacitySelect.value = "transparent";
        ui.opacitySlider.parentElement.hidden = false;
        ui.opacitySlider.value = opacity.toString();
        ui.opacityNumber.value = opacity.toString();
        network_1.data.modelUpdater.modelRenderer.setOpacity(opacity);
    }
}
exports.setupOpacity = setupOpacity;
