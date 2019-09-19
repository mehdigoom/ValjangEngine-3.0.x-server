"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const network_1 = require("./network");
const mapArea_1 = require("./mapArea");
const tileSetArea_1 = require("./tileSetArea");
const TreeView = require("dnd-tree-view");
const ResizeHandle = require("resize-handle");
const tmpPosition = new SupEngine.THREE.Vector3();
const tmpScale = new SupEngine.THREE.Vector3();
const ui = {};
exports.default = ui;
// Setup resize handles
new ResizeHandle(document.querySelector(".sidebar"), "right");
new ResizeHandle(document.querySelector(".layers"), "bottom");
ui.tileSetInput = document.querySelector(".property-tileSetId");
ui.tileSetInput.addEventListener("input", onTileSetChange);
ui.tileSetInput.addEventListener("keyup", (event) => { event.stopPropagation(); });
ui.openTileSetButton = document.querySelector("button.open-tileSet");
ui.openTileSetButton.addEventListener("click", (event) => {
    SupClient.openEntry(network_1.data.tileMapUpdater.tileMapAsset.pub.tileSetId);
});
ui.sizeInput = document.querySelector(".property-size");
document.querySelector("button.resize").addEventListener("click", onResizeMapClick);
document.querySelector("button.move").addEventListener("click", onMoveMapClick);
ui.settings = {};
["pixelsPerUnit", "layerDepthOffset"].forEach((setting) => {
    const queryName = `.property-${setting}`;
    const settingObj = ui.settings[setting] = document.querySelector(queryName);
    settingObj.addEventListener("change", (event) => {
        const value = (setting === "layerDepthOffset") ? parseFloat(settingObj.value) : parseInt(settingObj.value, 10);
        network_1.data.projectClient.editAsset(SupClient.query.asset, "setProperty", setting, value);
    });
});
ui.gridCheckbox = document.querySelector("input.grid-checkbox");
ui.gridCheckbox.addEventListener("change", onChangeGridDisplay);
ui.highlightCheckbox = document.querySelector("input.highlight-checkbox");
ui.highlightCheckbox.addEventListener("change", onChangeHighlight);
ui.highlightSlider = document.querySelector("input.highlight-slider");
ui.highlightSlider.addEventListener("input", onChangeHighlight);
ui.brushToolButton = document.querySelector("input#Brush");
ui.brushToolButton.addEventListener("change", () => { selectBrushTool(); });
ui.fillToolButton = document.querySelector("input#Fill");
ui.fillToolButton.addEventListener("change", () => { selectFillTool(); });
ui.selectionToolButton = document.querySelector("input#Selection");
ui.selectionToolButton.addEventListener("change", () => { selectSelectionTool(); });
ui.eraserToolButton = document.querySelector("input#Eraser");
ui.eraserToolButton.addEventListener("change", () => { selectEraserTool(); });
ui.layersTreeView = new TreeView(document.querySelector(".layers-tree-view"), { dragStartCallback: () => true, dropCallback: onLayersTreeViewDrop, multipleSelection: false });
ui.layersTreeView.on("selectionChange", onLayerSelect);
document.querySelector("button.new-layer").addEventListener("click", onNewLayerClick);
document.querySelector("button.rename-layer").addEventListener("click", onRenameLayerClick);
document.querySelector("button.delete-layer").addEventListener("click", onDeleteLayerClick);
ui.mousePositionLabel = {
    x: document.querySelector("label.position-x"),
    y: document.querySelector("label.position-y")
};
// Keybindings
document.addEventListener("keyup", (event) => {
    if (event.target.tagName === "INPUT")
        return;
    const keyEvent = window.KeyEvent;
    switch (event.keyCode) {
        case keyEvent.DOM_VK_B:
            selectBrushTool();
            break;
        case keyEvent.DOM_VK_F:
            selectFillTool();
            break;
        case keyEvent.DOM_VK_S:
            selectSelectionTool();
            break;
        case keyEvent.DOM_VK_E:
            selectEraserTool();
            break;
        case keyEvent.DOM_VK_G:
            ui.gridCheckbox.checked = !ui.gridCheckbox.checked;
            onChangeGridDisplay();
            break;
        case keyEvent.DOM_VK_I:
            ui.highlightCheckbox.checked = !ui.highlightCheckbox.checked;
            onChangeHighlight();
            break;
        case keyEvent.DOM_VK_H:
            mapArea_1.flipTilesHorizontally();
            break;
        case keyEvent.DOM_VK_V:
            mapArea_1.flipTilesVertically();
            break;
        case keyEvent.DOM_VK_R:
            mapArea_1.rotateTiles();
            break;
        case keyEvent.DOM_VK_A:
            if (event.ctrlKey) {
                selectSelectionTool();
                mapArea_1.selectEntireLayer();
            }
            break;
    }
});
SupClient.setupHelpCallback(() => {
    window.parent.postMessage({ type: "openTool", name: "documentation", state: { section: "tileMap" } }, window.location.origin);
});
function onTileSetChange(event) {
    const value = event.target.value;
    if (value === "") {
        network_1.data.projectClient.editAsset(SupClient.query.asset, "changeTileSet", null);
        return;
    }
    const entry = SupClient.findEntryByPath(network_1.data.projectClient.entries.pub, value);
    if (entry != null && entry.type === "tileSet")
        network_1.data.projectClient.editAsset(SupClient.query.asset, "changeTileSet", entry.id);
}
function onResizeMapClick() {
    const options = {
        initialValue: network_1.data.tileMapUpdater.tileMapAsset.pub.width.toString(),
        validationLabel: SupClient.i18n.t("tileMapEditor:resize"),
        cancelLabel: SupClient.i18n.t("common:actions.skip")
    };
    new SupClient.Dialogs.PromptDialog(SupClient.i18n.t("tileMapEditor:newWidthPrompt"), options, (newWidthString) => {
        let newWidth = network_1.data.tileMapUpdater.tileMapAsset.pub.width;
        if (newWidthString != null && !isNaN(parseInt(newWidthString, 10)))
            newWidth = parseInt(newWidthString, 10);
        const options = {
            initialValue: network_1.data.tileMapUpdater.tileMapAsset.pub.height.toString(),
            validationLabel: SupClient.i18n.t("tileMapEditor:resize"),
            cancelLabel: SupClient.i18n.t("common:actions.skip")
        };
        new SupClient.Dialogs.PromptDialog(SupClient.i18n.t("tileMapEditor:newHeightPrompt"), options, (newHeightString) => {
            let newHeight = network_1.data.tileMapUpdater.tileMapAsset.pub.height;
            if (newHeightString != null && !isNaN(parseInt(newHeightString, 10)))
                newHeight = parseInt(newHeightString, 10);
            if (newWidth === network_1.data.tileMapUpdater.tileMapAsset.pub.width && newHeight === network_1.data.tileMapUpdater.tileMapAsset.pub.height)
                return;
            network_1.data.projectClient.editAsset(SupClient.query.asset, "resizeMap", newWidth, newHeight);
        });
    });
}
function onMoveMapClick() {
    const options = {
        initialValue: "0",
        validationLabel: SupClient.i18n.t("tileMapEditor:applyOffset"),
        cancelLabel: SupClient.i18n.t("common:actions.skip")
    };
    new SupClient.Dialogs.PromptDialog(SupClient.i18n.t("tileMapEditor:horizontalOffsetPrompt"), options, (horizontalOffsetString) => {
        let horizontalOffset = 0;
        if (horizontalOffsetString != null && !isNaN(parseInt(horizontalOffsetString, 10)))
            horizontalOffset = parseInt(horizontalOffsetString, 10);
        new SupClient.Dialogs.PromptDialog(SupClient.i18n.t("tileMapEditor:verticalOffsetPrompt"), options, (verticalOffsetString) => {
            let verticalOffset = 0;
            if (verticalOffsetString != null && !isNaN(parseInt(verticalOffsetString, 10)))
                verticalOffset = parseInt(verticalOffsetString, 10);
            if (horizontalOffset === 0 && verticalOffset === 0)
                return;
            network_1.data.projectClient.editAsset(SupClient.query.asset, "moveMap", horizontalOffset, verticalOffset);
        });
    });
}
function onNewLayerClick() {
    const options = {
        initialValue: SupClient.i18n.t("tileMapEditor:newLayerInitialValue"),
        validationLabel: SupClient.i18n.t("common:actions.create")
    };
    new SupClient.Dialogs.PromptDialog(SupClient.i18n.t("tileMapEditor:newLayerPrompt"), options, (name) => {
        if (name == null)
            return;
        let index = SupClient.getTreeViewInsertionPoint(ui.layersTreeView).index;
        index = network_1.data.tileMapUpdater.tileMapAsset.pub.layers.length - index + 1;
        network_1.data.projectClient.editAsset(SupClient.query.asset, "newLayer", name, index, (layerId) => {
            ui.layersTreeView.clearSelection();
            ui.layersTreeView.addToSelection(ui.layersTreeView.treeRoot.querySelector(`li[data-id="${layerId}"]`));
            tileSetArea_1.default.selectedLayerId = layerId;
        });
    });
}
function onRenameLayerClick() {
    if (ui.layersTreeView.selectedNodes.length !== 1)
        return;
    const selectedNode = ui.layersTreeView.selectedNodes[0];
    const layer = network_1.data.tileMapUpdater.tileMapAsset.layers.byId[selectedNode.dataset["id"]];
    const options = {
        initialValue: layer.name,
        validationLabel: SupClient.i18n.t("common:actions.rename")
    };
    new SupClient.Dialogs.PromptDialog(SupClient.i18n.t("tileMapEditor:renameLayerPrompt"), options, (newName) => {
        if (newName == null)
            return;
        network_1.data.projectClient.editAsset(SupClient.query.asset, "renameLayer", layer.id, newName);
    });
}
function onDeleteLayerClick() {
    if (ui.layersTreeView.selectedNodes.length !== 1)
        return;
    const confirmLabel = SupClient.i18n.t("tileMapEditor:deleteLayerConfirm");
    const validationLabel = SupClient.i18n.t("common:actions.delete");
    new SupClient.Dialogs.ConfirmDialog(confirmLabel, { validationLabel }, (confirm) => {
        if (!confirm)
            return;
        const selectedNode = ui.layersTreeView.selectedNodes[0];
        network_1.data.projectClient.editAsset(SupClient.query.asset, "deleteLayer", selectedNode.dataset["id"]);
    });
}
function onLayersTreeViewDrop(event, dropLocation, orderedNodes) {
    const id = orderedNodes[0].dataset["id"];
    const newIndex = SupClient.getListViewDropIndex(dropLocation, network_1.data.tileMapUpdater.tileMapAsset.layers, true);
    network_1.data.projectClient.editAsset(SupClient.query.asset, "moveLayer", id, newIndex);
    return false;
}
function onLayerSelect() {
    if (ui.layersTreeView.selectedNodes.length === 0) {
        ui.layersTreeView.addToSelection(ui.layersTreeView.treeRoot.querySelector(`li[data-id="${tileSetArea_1.default.selectedLayerId}"]`));
    }
    else {
        tileSetArea_1.default.selectedLayerId = ui.layersTreeView.selectedNodes[0].dataset["id"];
    }
    onChangeHighlight();
    const pub = network_1.data.tileMapUpdater.tileMapAsset.pub;
    const layer = network_1.data.tileMapUpdater.tileMapAsset.layers.byId[tileSetArea_1.default.selectedLayerId];
    const z = (pub.layers.indexOf(layer) + 0.5) * pub.layerDepthOffset;
    mapArea_1.default.patternActor.setLocalPosition(new SupEngine.THREE.Vector3(0, 0, z));
}
function onChangeGridDisplay() {
    mapArea_1.default.gridActor.threeObject.visible = ui.gridCheckbox.checked;
}
function onChangeHighlight() {
    for (const id in network_1.data.tileMapUpdater.tileMapRenderer.layerMeshesById) {
        const layerMesh = network_1.data.tileMapUpdater.tileMapRenderer.layerMeshesById[id];
        const opacity = ui.highlightCheckbox.checked && id !== tileSetArea_1.default.selectedLayerId ? parseFloat(ui.highlightSlider.value) / 100 : 1;
        layerMesh.material.uniforms["opacity"].value = opacity;
    }
}
function selectBrushTool(x, y, width = 1, height = 1) {
    ui.brushToolButton.checked = true;
    if (network_1.data.tileMapUpdater.tileSetAsset == null || network_1.data.tileMapUpdater.tileSetAsset.pub == null)
        return;
    if (x != null && y != null)
        network_1.data.tileSetUpdater.tileSetRenderer.select(x, y, width, height);
    const ratio = network_1.data.tileSetUpdater.tileSetAsset.pub.grid.width / network_1.data.tileSetUpdater.tileSetAsset.pub.grid.height;
    network_1.data.tileSetUpdater.tileSetRenderer.selectedTileActor.getLocalPosition(tmpPosition);
    tmpPosition.y = Math.round(tmpPosition.y * ratio);
    network_1.data.tileSetUpdater.tileSetRenderer.selectedTileActor.getLocalScale(tmpScale);
    tmpScale.y = Math.round(tmpScale.y * ratio);
    const layerData = [];
    for (let y = -tmpScale.y - 1; y >= 0; y--) {
        for (let x = 0; x < tmpScale.x; x++) {
            layerData.push([tmpPosition.x + x, -tmpPosition.y + y, false, false, 0]);
        }
    }
    mapArea_1.setupPattern(layerData, tmpScale.x);
    mapArea_1.default.lastTile = null;
    mapArea_1.default.patternActor.threeObject.visible = true;
    network_1.data.tileSetUpdater.tileSetRenderer.selectedTileActor.threeObject.visible = true;
    mapArea_1.default.patternBackgroundActor.threeObject.visible = true;
    mapArea_1.default.patternBackgroundActor.setLocalScale(new SupEngine.THREE.Vector3(width, height / ratio, 1));
}
exports.selectBrushTool = selectBrushTool;
function selectFillTool(x, y) {
    ui.fillToolButton.checked = true;
    if (network_1.data.tileMapUpdater.tileSetAsset == null || network_1.data.tileMapUpdater.tileSetAsset.pub == null)
        return;
    if (x != null && y != null)
        network_1.data.tileSetUpdater.tileSetRenderer.select(x, y);
    network_1.data.tileSetUpdater.tileSetRenderer.selectedTileActor.getLocalPosition(tmpPosition);
    mapArea_1.setupFillPattern([tmpPosition.x, -tmpPosition.y, false, false, 0]);
    mapArea_1.default.patternActor.threeObject.visible = true;
    network_1.data.tileSetUpdater.tileSetRenderer.selectedTileActor.threeObject.visible = true;
    mapArea_1.default.patternBackgroundActor.threeObject.visible = false;
}
exports.selectFillTool = selectFillTool;
function selectSelectionTool() {
    ui.selectionToolButton.checked = true;
    if (network_1.data.tileMapUpdater.tileSetAsset == null || network_1.data.tileMapUpdater.tileSetAsset.pub == null)
        return;
    mapArea_1.default.patternActor.threeObject.visible = false;
    mapArea_1.default.patternBackgroundActor.threeObject.visible = false;
    network_1.data.tileSetUpdater.tileSetRenderer.selectedTileActor.threeObject.visible = false;
    mapArea_1.default.selectionStartPoint = null;
}
exports.selectSelectionTool = selectSelectionTool;
function selectEraserTool() {
    ui.eraserToolButton.checked = true;
    if (network_1.data.tileMapUpdater.tileSetAsset == null || network_1.data.tileMapUpdater.tileSetAsset.pub == null)
        return;
    mapArea_1.default.patternActor.threeObject.visible = false;
    network_1.data.tileSetUpdater.tileSetRenderer.selectedTileActor.threeObject.visible = false;
    mapArea_1.default.patternBackgroundActor.threeObject.visible = true;
    const ratio = network_1.data.tileSetUpdater.tileSetAsset.pub.grid.width / network_1.data.tileSetUpdater.tileSetAsset.pub.grid.height;
    mapArea_1.default.patternBackgroundActor.setLocalScale(new SupEngine.THREE.Vector3(1, 1 / ratio, 1));
}
exports.selectEraserTool = selectEraserTool;
function setupLayer(layer, index) {
    const liElt = document.createElement("li");
    liElt.dataset["id"] = layer.id;
    const displayCheckbox = document.createElement("input");
    displayCheckbox.classList.add("display");
    displayCheckbox.type = "checkbox";
    displayCheckbox.checked = true;
    displayCheckbox.addEventListener("change", () => {
        network_1.data.tileMapUpdater.tileMapRenderer.layerVisibleById[layer.id] = displayCheckbox.checked;
    });
    displayCheckbox.addEventListener("click", (event) => { event.stopPropagation(); });
    liElt.appendChild(displayCheckbox);
    const indexSpan = document.createElement("span");
    indexSpan.classList.add("index");
    indexSpan.textContent = `${index} -`;
    liElt.appendChild(indexSpan);
    const nameSpan = document.createElement("span");
    nameSpan.classList.add("name");
    nameSpan.textContent = layer.name;
    liElt.appendChild(nameSpan);
    ui.layersTreeView.insertAt(liElt, "item", network_1.data.tileMapUpdater.tileMapAsset.pub.layers.length - 1 - index);
}
exports.setupLayer = setupLayer;
function refreshLayersId() {
    for (let layerIndex = 0; layerIndex < network_1.data.tileMapUpdater.tileMapAsset.pub.layers.length; layerIndex++) {
        const layerId = network_1.data.tileMapUpdater.tileMapAsset.pub.layers[layerIndex].id;
        const indexSpanElt = ui.layersTreeView.treeRoot.querySelector(`[data-id="${layerId}"] .index`);
        indexSpanElt.textContent = `${layerIndex} -`;
    }
}
exports.refreshLayersId = refreshLayersId;
