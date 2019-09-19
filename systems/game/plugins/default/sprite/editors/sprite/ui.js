"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const network_1 = require("./network");
const animationArea_1 = require("./animationArea");
const spritesheetArea_1 = require("./spritesheetArea");
const SpriteAsset_1 = require("../../data/SpriteAsset");
const ResizeHandle = require("resize-handle");
const TreeView = require("dnd-tree-view");
const ui = {};
exports.default = ui;
// Setup resizable panes
new ResizeHandle(document.querySelector(".sidebar"), "right");
// Setup properties
const fileSelect = document.querySelector("input.file-select");
fileSelect.addEventListener("change", onUploadMainMap);
document.querySelector("button.upload").addEventListener("click", () => { fileSelect.click(); });
document.querySelector("button.download").addEventListener("click", () => {
    const textureName = network_1.data.spriteUpdater.spriteAsset.pub.mapSlots["map"];
    downloadTexture(textureName);
});
ui.allSettings = [
    "filtering", "wrapping", "pixelsPerUnit", "framesPerSecond", "opacity", "alphaTest",
    "frameOrder", "grid.width", "grid.height", "origin.x", "origin.y"
];
ui.settings = {};
ui.allSettings.forEach((setting) => {
    const parts = setting.split(".");
    let obj = ui.settings;
    let queryName = ".property-";
    parts.slice(0, parts.length - 1).forEach((part) => {
        if (obj[part] == null)
            obj[part] = {};
        obj = obj[part];
        queryName += `${part}-`;
    });
    queryName += parts[parts.length - 1];
    const settingObj = obj[parts[parts.length - 1]] = document.querySelector(queryName);
    switch (setting) {
        case "filtering":
        case "wrapping":
        case "frameOrder":
            settingObj.addEventListener("change", (event) => { network_1.data.projectClient.editAsset(SupClient.query.asset, "setProperty", setting, event.target.value); });
            break;
        case "opacity":
        case "alphaTest":
            settingObj.addEventListener("input", (event) => {
                const value = parseFloat(event.target.value);
                if (isNaN(value))
                    return;
                network_1.data.projectClient.editAsset(SupClient.query.asset, "setProperty", setting, value);
            });
            break;
        default:
            if (setting.indexOf("origin") !== -1)
                settingObj.addEventListener("change", (event) => { network_1.data.projectClient.editAsset(SupClient.query.asset, "setProperty", setting, event.target.value / 100); });
            else
                settingObj.addEventListener("change", (event) => { network_1.data.projectClient.editAsset(SupClient.query.asset, "setProperty", setting, parseInt(event.target.value, 10)); });
            break;
    }
});
ui.opacitySelect = document.querySelector(".opacity-select");
ui.opacitySelect.addEventListener("change", (event) => { network_1.data.projectClient.editAsset(SupClient.query.asset, "setProperty", "opacity", event.target.value === "transparent" ? 1 : null); });
ui.opacitySlider = document.querySelector(".opacity-slider");
ui.opacitySlider.addEventListener("input", (event) => { network_1.data.projectClient.editAsset(SupClient.query.asset, "setProperty", "opacity", parseFloat(event.target.value)); });
document.querySelector("button.set-grid-size").addEventListener("click", onSetGridSize);
ui.imageSize = document.querySelector("td.image-size input");
// Animations
ui.animationsTreeView = new TreeView(document.querySelector(".animations-tree-view"), { dragStartCallback: () => true, dropCallback: onAnimationsTreeViewDrop });
ui.animationsTreeView.on("selectionChange", updateSelectedAnimation);
document.querySelector("button.new-animation").addEventListener("click", onNewAnimationClick);
document.querySelector("button.rename-animation").addEventListener("click", onRenameAnimationClick);
document.querySelector("button.delete-animation").addEventListener("click", onDeleteAnimationClick);
ui.animationPlay = document.querySelector("button.animation-play");
ui.animationPlay.addEventListener("click", onPlayAnimation);
ui.animationSlider = document.querySelector("input.animation-slider");
ui.animationSlider.addEventListener("input", onChangeAnimationTime);
document.querySelector("input.animation-loop").addEventListener("change", (event) => {
    network_1.data.spriteUpdater.config_setProperty("looping", event.target.checked);
});
// Advanced textures
ui.texturesPane = document.querySelector(".advanced-textures");
SupClient.setupCollapsablePane(ui.texturesPane);
ui.texturesTreeView = new TreeView(document.querySelector(".textures-tree-view"));
ui.texturesTreeView.on("selectionChange", updateSelectedMap);
ui.mapSlotsInput = {};
for (const slotName in SpriteAsset_1.default.schema["mapSlots"].properties) {
    ui.mapSlotsInput[slotName] = document.querySelector(`.map-${slotName}`);
    ui.mapSlotsInput[slotName].dataset["name"] = slotName;
    ui.mapSlotsInput[slotName].addEventListener("input", onEditMapSlot);
}
document.querySelector("button.new-map").addEventListener("click", onNewMapClick);
const mapFileSelect = document.querySelector(".upload-map.file-select");
mapFileSelect.addEventListener("change", onUploadMapClick);
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
function onUploadMainMap(event) {
    const target = event.target;
    if (target.files.length === 0)
        return;
    const textureName = network_1.data.spriteUpdater.spriteAsset.pub.mapSlots["map"];
    const willSetupGridSize = network_1.data.spriteUpdater.spriteAsset.pub.maps[textureName].byteLength === 0;
    const maps = {};
    const reader = new FileReader();
    reader.onload = (event) => {
        const buffer = event.target.result;
        maps[textureName] = buffer;
        network_1.data.projectClient.editAsset(SupClient.query.asset, "setMaps", maps, () => {
            if (!willSetupGridSize)
                return;
            const image = new Image();
            const typedArray = new Uint8Array(buffer);
            const blob = new Blob([typedArray], { type: "image/*" });
            const blobURL = URL.createObjectURL(blob);
            image.src = blobURL;
            image.addEventListener("load", (event) => {
                const gridSize = { width: image.width, height: image.height };
                network_1.data.projectClient.editAsset(SupClient.query.asset, "setProperty", "grid", gridSize);
                URL.revokeObjectURL(blobURL);
            });
            image.addEventListener("error", (event) => {
                URL.revokeObjectURL(blobURL);
            });
        });
    };
    reader.readAsArrayBuffer(target.files[0]);
    target.parentElement.reset();
}
function downloadTexture(textureName) {
    function triggerDownload(name) {
        const anchor = document.createElement("a");
        document.body.appendChild(anchor);
        anchor.style.display = "none";
        anchor.href = network_1.data.spriteUpdater.spriteAsset.mapObjectURLs[textureName];
        // Not yet supported in IE and Safari (http://caniuse.com/#feat=download)
        anchor.download = `${name}.png`;
        anchor.click();
        document.body.removeChild(anchor);
    }
    const options = {
        initialValue: SupClient.i18n.t("spriteEditor:sidebar.settings.sprite.texture.download.defaultName"),
        validationLabel: SupClient.i18n.t("common:actions.download")
    };
    if (SupApp != null) {
        triggerDownload(options.initialValue);
    }
    else {
        new SupClient.Dialogs.PromptDialog(SupClient.i18n.t("spriteEditor:sidebar.settings.sprite.texture.download.prompt"), options, (name) => {
            if (name == null)
                return;
            triggerDownload(name);
        });
    }
}
function onSetGridSize(event) {
    const texture = network_1.data.spriteUpdater.spriteAsset.pub.textures["map"];
    if (texture == null)
        return;
    // TODO: Replace with a single popup
    const options = {
        initialValue: "1",
        validationLabel: SupClient.i18n.t("spriteEditor:sidebar.settings.sprite.grid.setWidth"),
        cancelLabel: SupClient.i18n.t("common:actions.skip")
    };
    new SupClient.Dialogs.PromptDialog(SupClient.i18n.t("spriteEditor:sidebar.settings.sprite.grid.widthPrompt"), options, (framesPerRow) => {
        if (framesPerRow != null) {
            const framesPerRowNum = parseInt(framesPerRow, 10);
            if (isNaN(framesPerRowNum))
                return;
            network_1.data.projectClient.editAsset(SupClient.query.asset, "setProperty", "grid.width", Math.floor(texture.size.width / framesPerRowNum));
        }
        options.validationLabel = SupClient.i18n.t("spriteEditor:sidebar.settings.sprite.grid.setHeight");
        new SupClient.Dialogs.PromptDialog(SupClient.i18n.t("spriteEditor:sidebar.settings.sprite.grid.heightPrompt"), options, (framesPerColumn) => {
            if (framesPerColumn != null) {
                const framesPerColumnNum = parseInt(framesPerColumn, 10);
                if (isNaN(framesPerColumnNum))
                    return;
                network_1.data.projectClient.editAsset(SupClient.query.asset, "setProperty", "grid.height", Math.floor(texture.size.height / framesPerColumnNum));
            }
        });
    });
}
function onNewAnimationClick() {
    const options = {
        initialValue: "Animation",
        validationLabel: SupClient.i18n.t("common:actions.create")
    };
    new SupClient.Dialogs.PromptDialog(SupClient.i18n.t("spriteEditor:sidebar.animations.newAnimationPrompt"), options, (name) => {
        if (name == null)
            return;
        network_1.data.projectClient.editAsset(SupClient.query.asset, "newAnimation", name, (animationId) => {
            ui.animationsTreeView.clearSelection();
            ui.animationsTreeView.addToSelection(ui.animationsTreeView.treeRoot.querySelector(`li[data-id='${animationId}']`));
            updateSelectedAnimation();
        });
    });
}
function onRenameAnimationClick() {
    if (ui.animationsTreeView.selectedNodes.length !== 1)
        return;
    const selectedNode = ui.animationsTreeView.selectedNodes[0];
    const animation = network_1.data.spriteUpdater.spriteAsset.animations.byId[selectedNode.dataset["id"]];
    const options = {
        initialValue: animation.name,
        validationLabel: SupClient.i18n.t("common:actions.rename")
    };
    new SupClient.Dialogs.PromptDialog(SupClient.i18n.t("spriteEditor:sidebar.animations.renameAnimationPrompt"), options, (newName) => {
        if (newName == null)
            return;
        network_1.data.projectClient.editAsset(SupClient.query.asset, "setAnimationProperty", animation.id, "name", newName);
    });
}
function onDeleteAnimationClick() {
    if (ui.animationsTreeView.selectedNodes.length === 0)
        return;
    const confirmLabel = SupClient.i18n.t("spriteEditor:sidebar.animations.deleteAnimationPrompt");
    const validationLabel = SupClient.i18n.t("common:actions.delete");
    new SupClient.Dialogs.ConfirmDialog(confirmLabel, { validationLabel }, (confirm) => {
        if (!confirm)
            return;
        ui.animationsTreeView.selectedNodes.forEach((selectedNode) => { network_1.data.projectClient.editAsset(SupClient.query.asset, "deleteAnimation", selectedNode.dataset["id"]); });
    });
}
function onAnimationsTreeViewDrop(event, dropLocation, orderedNodes) {
    const animationIds = [];
    orderedNodes.forEach((animation) => { animationIds.push(animation.dataset["id"]); });
    const index = SupClient.getListViewDropIndex(dropLocation, network_1.data.spriteUpdater.spriteAsset.animations);
    animationIds.forEach((id, i) => { network_1.data.projectClient.editAsset(SupClient.query.asset, "moveAnimation", id, index + i); });
    return false;
}
function updateSelectedAnimation() {
    const selectedAnimElt = ui.animationsTreeView.selectedNodes[0];
    if (selectedAnimElt != null) {
        ui.selectedAnimationId = selectedAnimElt.dataset["id"];
        network_1.data.spriteUpdater.config_setProperty("animationId", ui.selectedAnimationId);
        ui.animationPlay.disabled = false;
        ui.animationSlider.disabled = false;
        ui.animationSlider.max = (network_1.data.spriteUpdater.spriteRenderer.getAnimationFrameCount() - 1).toString();
        spritesheetArea_1.updateSelection();
        ui.animationPlay.textContent = "❚❚";
    }
    else {
        ui.selectedAnimationId = null;
        network_1.data.spriteUpdater.config_setProperty("animationId", null);
        ui.animationPlay.disabled = true;
        ui.animationSlider.disabled = true;
        ui.animationSlider.value = "0";
        spritesheetArea_1.default.selectionRenderer.clearMesh();
        ui.animationPlay.textContent = "▶";
    }
    const buttons = document.querySelectorAll(".animations-buttons button");
    for (let index = 0; index < buttons.length; index++) {
        const button = buttons.item(index);
        button.disabled = ui.selectedAnimationId == null && button.className !== "new-animation";
    }
}
exports.updateSelectedAnimation = updateSelectedAnimation;
function onPlayAnimation() {
    if (ui.animationPlay.textContent === "❚❚") {
        network_1.data.spriteUpdater.spriteRenderer.pauseAnimation();
        ui.animationPlay.textContent = "▶";
    }
    else {
        network_1.data.spriteUpdater.spriteRenderer.playAnimation(network_1.data.spriteUpdater.looping);
        ui.animationPlay.textContent = "❚❚";
    }
}
function onChangeAnimationTime() {
    if (network_1.data.spriteUpdater == null)
        return;
    network_1.data.spriteUpdater.spriteRenderer.setAnimationFrameTime(parseInt(ui.animationSlider.value, 10));
}
function setupProperty(path, value) {
    if (path === "grid") {
        ui.settings["grid"]["width"].value = value.width;
        ui.settings["grid"]["height"].value = value.height;
    }
    else {
        const parts = path.split(".");
        let obj = ui.settings;
        parts.slice(0, parts.length - 1).forEach((part) => { obj = obj[part]; });
        if (path.indexOf("origin") !== -1)
            value *= 100;
        obj[parts[parts.length - 1]].value = value;
    }
    const pub = network_1.data.spriteUpdater.spriteAsset.pub;
    if (path === "filtering" && spritesheetArea_1.default.spriteRenderer.asset != null) {
        if (value === "pixelated") {
            spritesheetArea_1.default.spritesheet.textures["map"].magFilter = SupEngine.THREE.NearestFilter;
            spritesheetArea_1.default.spritesheet.textures["map"].minFilter = SupEngine.THREE.NearestFilter;
        }
        else {
            spritesheetArea_1.default.spritesheet.textures["map"].magFilter = SupEngine.THREE.LinearFilter;
            spritesheetArea_1.default.spritesheet.textures["map"].minFilter = SupEngine.THREE.LinearMipMapLinearFilter;
        }
        spritesheetArea_1.default.spritesheet.textures["map"].needsUpdate = true;
    }
    if (path === "wrapping" && spritesheetArea_1.default.spriteRenderer.asset != null) {
        if (value === "clampToEdge") {
            spritesheetArea_1.default.spritesheet.textures["map"].wrapS = SupEngine.THREE.ClampToEdgeWrapping;
            spritesheetArea_1.default.spritesheet.textures["map"].wrapT = SupEngine.THREE.ClampToEdgeWrapping;
        }
        else if (value === "repeat") {
            spritesheetArea_1.default.spritesheet.textures["map"].wrapS = SupEngine.THREE.RepeatWrapping;
            spritesheetArea_1.default.spritesheet.textures["map"].wrapT = SupEngine.THREE.RepeatWrapping;
        }
        else if (value === "mirroredRepeat") {
            spritesheetArea_1.default.spritesheet.textures["map"].wrapS = SupEngine.THREE.MirroredRepeatWrapping;
            spritesheetArea_1.default.spritesheet.textures["map"].wrapT = SupEngine.THREE.MirroredRepeatWrapping;
        }
        spritesheetArea_1.default.spritesheet.textures["map"].needsUpdate = true;
    }
    if (path === "opacity") {
        if (value == null) {
            ui.opacitySelect.value = "opaque";
            ui.opacitySlider.parentElement.hidden = true;
            spritesheetArea_1.default.spriteRenderer.setOpacity(null);
        }
        else {
            ui.opacitySelect.value = "transparent";
            ui.opacitySlider.parentElement.hidden = false;
            ui.opacitySlider.value = value;
            spritesheetArea_1.default.spriteRenderer.setOpacity(1);
        }
    }
    if (path === "alphaTest" && spritesheetArea_1.default.spriteRenderer.material != null) {
        spritesheetArea_1.default.spriteRenderer.material.alphaTest = value;
        spritesheetArea_1.default.spriteRenderer.material.needsUpdate = true;
    }
    if (path === "pixelsPerUnit") {
        // FIXME: .setPixelsPerUnit(...) maybe?
        spritesheetArea_1.default.spritesheet.pixelsPerUnit = value;
        spritesheetArea_1.default.spriteRenderer.updateShape();
        spritesheetArea_1.default.gridRenderer.setRatio({ x: pub.pixelsPerUnit / pub.grid.width, y: pub.pixelsPerUnit / pub.grid.height });
        spritesheetArea_1.default.cameraControls.setMultiplier(value);
        animationArea_1.default.cameraControls.setMultiplier(value);
        animationArea_1.default.originMakerComponent.setScale(100 / value);
        spritesheetArea_1.updateSelection();
    }
    const gridPaths = ["grid", "grid.width", "grid.height"];
    if (gridPaths.indexOf(path) !== -1) {
        spritesheetArea_1.default.gridRenderer.setRatio({ x: pub.pixelsPerUnit / pub.grid.width, y: pub.pixelsPerUnit / pub.grid.height });
        const texture = pub.textures[pub.mapSlots["map"]];
        if (texture != null) {
            const width = Math.floor(texture.size.width / pub.grid.width);
            const height = Math.floor(texture.size.height / pub.grid.height);
            spritesheetArea_1.default.gridRenderer.resize(width, height);
        }
        spritesheetArea_1.updateSelection();
    }
    if (path === "frameOrder")
        spritesheetArea_1.updateSelection();
}
exports.setupProperty = setupProperty;
function setupAnimation(animation, index) {
    const liElt = document.createElement("li");
    liElt.dataset["id"] = animation.id;
    const nameSpan = document.createElement("span");
    nameSpan.className = "name";
    nameSpan.textContent = animation.name;
    liElt.appendChild(nameSpan);
    const startFrameIndexInput = document.createElement("input");
    startFrameIndexInput.type = "number";
    startFrameIndexInput.min = "0";
    startFrameIndexInput.className = "start-frame-index";
    startFrameIndexInput.value = animation.startFrameIndex;
    liElt.appendChild(startFrameIndexInput);
    startFrameIndexInput.addEventListener("change", (event) => {
        const startFrameIndex = parseInt(event.target.value, 10);
        network_1.data.projectClient.editAsset(SupClient.query.asset, "setAnimationProperty", animation.id, "startFrameIndex", startFrameIndex);
        if (startFrameIndex > network_1.data.spriteUpdater.spriteAsset.animations.byId[ui.selectedAnimationId].endFrameIndex)
            network_1.data.projectClient.editAsset(SupClient.query.asset, "setAnimationProperty", animation.id, "endFrameIndex", startFrameIndex);
    });
    const endFrameIndexInput = document.createElement("input");
    endFrameIndexInput.type = "number";
    endFrameIndexInput.min = "0";
    endFrameIndexInput.className = "end-frame-index";
    endFrameIndexInput.value = animation.endFrameIndex;
    liElt.appendChild(endFrameIndexInput);
    endFrameIndexInput.addEventListener("change", (event) => {
        const endFrameIndex = parseInt(event.target.value, 10);
        network_1.data.projectClient.editAsset(SupClient.query.asset, "setAnimationProperty", animation.id, "endFrameIndex", endFrameIndex);
        if (endFrameIndex < network_1.data.spriteUpdater.spriteAsset.animations.byId[ui.selectedAnimationId].startFrameIndex)
            network_1.data.projectClient.editAsset(SupClient.query.asset, "setAnimationProperty", animation.id, "startFrameIndex", endFrameIndex);
    });
    const speedInput = document.createElement("input");
    speedInput.type = "number";
    speedInput.className = "speed";
    speedInput.value = animation.speed;
    liElt.appendChild(speedInput);
    speedInput.addEventListener("change", (event) => {
        network_1.data.projectClient.editAsset(SupClient.query.asset, "setAnimationProperty", animation.id, "speed", parseFloat(event.target.value));
    });
    ui.animationsTreeView.insertAt(liElt, "item", index, null);
}
exports.setupAnimation = setupAnimation;
function onEditMapSlot(event) {
    if (event.target.value !== "" && network_1.data.spriteUpdater.spriteAsset.pub.maps[event.target.value] == null)
        return;
    const slot = event.target.value !== "" ? event.target.value : null;
    network_1.data.projectClient.editAsset(SupClient.query.asset, "setMapSlot", event.target.dataset["name"], slot);
}
function onNewMapClick() {
    const options = {
        initialValue: "map",
        validationLabel: SupClient.i18n.t("common:actions.create")
    };
    new SupClient.Dialogs.PromptDialog(SupClient.i18n.t("spriteEditor:sidebar.advancedTextures.newMapPrompt"), options, (name) => {
        if (name == null)
            return;
        network_1.data.projectClient.editAsset(SupClient.query.asset, "newMap", name);
    });
}
function onUploadMapClick(event) {
    if (ui.texturesTreeView.selectedNodes.length !== 1)
        return;
    const reader = new FileReader;
    const textureName = ui.texturesTreeView.selectedNodes[0].dataset["name"];
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
    const oldName = ui.texturesTreeView.selectedNodes[0].dataset["name"];
    const options = {
        initialValue: oldName,
        validationLabel: SupClient.i18n.t("common:actions.rename")
    };
    new SupClient.Dialogs.PromptDialog(SupClient.i18n.t("spriteEditor:sidebar.advancedTextures.renameMapPrompt"), options, (newName) => {
        if (newName == null)
            return;
        network_1.data.projectClient.editAsset(SupClient.query.asset, "renameMap", oldName, newName);
    });
}
function onDeleteMapClick() {
    if (ui.texturesTreeView.selectedNodes.length === 0)
        return;
    const confirmLabel = SupClient.i18n.t("spriteEditor:sidebar.advancedTextures.deleteMapPrompt");
    const validationLabel = SupClient.i18n.t("common:actions.delete");
    new SupClient.Dialogs.ConfirmDialog(confirmLabel, { validationLabel }, (confirm) => {
        if (!confirm)
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
