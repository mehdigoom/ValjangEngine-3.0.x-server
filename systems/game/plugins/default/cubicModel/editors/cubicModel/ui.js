"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const network_1 = require("./network");
const engine_1 = require("./engine");
const textureArea_1 = require("./textureArea");
const CubicModelAsset_1 = require("../../data/CubicModelAsset");
const TreeView = require("dnd-tree-view");
const ResizeHandle = require("resize-handle");
const THREE = SupEngine.THREE;
const ui = {};
exports.default = ui;
// Hotkeys
document.addEventListener("keydown", (event) => {
    if (document.querySelector(".dialog") != null)
        return;
    let activeElement = document.activeElement;
    while (activeElement != null) {
        if (activeElement === ui.canvasElt || activeElement === ui.treeViewElt)
            break;
        activeElement = activeElement.parentElement;
    }
    if (activeElement == null)
        return;
    if (event.keyCode === 78 && (event.ctrlKey || event.metaKey)) { // Ctrl+N
        event.preventDefault();
        onNewNodeClick();
    }
    if (event.keyCode === 113) { // F2
        event.preventDefault();
        onRenameNodeClick();
    }
    if (event.keyCode === 68 && (event.ctrlKey || event.metaKey)) { // Ctrl+D
        event.preventDefault();
        onDuplicateNodeClick();
    }
    if (event.keyCode === 46) { // Delete
        event.preventDefault();
        onDeleteNodeClick();
    }
});
ui.canvasElt = document.querySelector("canvas");
// Setup resizable panes
new ResizeHandle(document.querySelector(".texture-container"), "bottom");
new ResizeHandle(document.querySelector(".sidebar"), "right");
new ResizeHandle(document.querySelector(".nodes-tree-view"), "top");
// Grid
ui.gridSize = 20;
ui.gridStep = 1;
document.getElementById("grid-step").addEventListener("input", onGridStepInput);
document.getElementById("grid-visible").addEventListener("change", onGridVisibleChange);
function onGridStepInput(event) {
    const target = event.target;
    let value = parseFloat(target.value);
    if (value !== 0 && value < 0.0001) {
        value = 0;
        target.value = "0";
    }
    if (isNaN(value) || value <= 0) {
        target.reportValidity();
        return;
    }
    ui.gridStep = value;
    engine_1.default.gridHelperComponent.setup(ui.gridSize, ui.gridStep);
}
function onGridVisibleChange(event) {
    engine_1.default.gridHelperComponent.setVisible(event.target.checked);
}
// Unit ratio
ui.pixelsPerUnitInput = document.querySelector("input.property-pixelsPerUnit");
ui.pixelsPerUnitInput.addEventListener("change", onChangePixelsPerUnit);
function onChangePixelsPerUnit(event) { network_1.data.projectClient.editAsset(SupClient.query.asset, "setProperty", "pixelsPerUnit", parseFloat(event.target.value)); }
// Texture download
document.querySelector("button.download").addEventListener("click", (event) => {
    function triggerDownload(name) {
        const anchor = document.createElement("a");
        document.body.appendChild(anchor);
        anchor.style.display = "none";
        anchor.href = network_1.data.cubicModelUpdater.cubicModelAsset.clientTextureDatas["map"].ctx.canvas.toDataURL();
        // Not yet supported in IE and Safari (http://caniuse.com/#feat=download)
        anchor.download = `${name}.png`;
        anchor.click();
        document.body.removeChild(anchor);
    }
    const options = {
        initialValue: SupClient.i18n.t("cubicModelEditor:sidebar.settings.cubicModel.download.defaultName"),
        validationLabel: SupClient.i18n.t("common:actions.download")
    };
    if (SupApp != null) {
        triggerDownload(options.initialValue);
    }
    else {
        new SupClient.Dialogs.PromptDialog(SupClient.i18n.t("cubicModelEditor:sidebar.settings.cubicModel.download.prompt"), options, (name) => {
            if (name == null)
                return;
            triggerDownload(name);
        });
    }
});
// Texture size
ui.textureWidthSelect = document.querySelector("select.property-texture-width");
ui.textureHeightSelect = document.querySelector("select.property-texture-height");
const addOption = (parent, value) => {
    const optionElt = document.createElement("option");
    optionElt.textContent = value.toString();
    optionElt.value = value.toString();
    parent.appendChild(optionElt);
};
for (const size of CubicModelAsset_1.default.validTextureSizes) {
    addOption(ui.textureWidthSelect, size);
    addOption(ui.textureHeightSelect, size);
}
ui.textureWidthSelect.addEventListener("input", (event) => { network_1.data.projectClient.editAsset(SupClient.query.asset, "changeTextureWidth", parseInt(event.target.value, 10)); });
ui.textureHeightSelect.addEventListener("input", (event) => { network_1.data.projectClient.editAsset(SupClient.query.asset, "changeTextureHeight", parseInt(event.target.value, 10)); });
// Setup tree view
ui.treeViewElt = document.querySelector(".nodes-tree-view");
ui.nodesTreeView = new TreeView(ui.treeViewElt, { dragStartCallback: () => true, dropCallback: onNodesTreeViewDrop });
ui.nodesTreeView.on("activate", onNodeActivate);
ui.nodesTreeView.on("selectionChange", () => { setupSelectedNode(); });
function createNodeElement(node) {
    const liElt = document.createElement("li");
    liElt.dataset["id"] = node.id;
    const nameSpan = document.createElement("span");
    nameSpan.classList.add("name");
    nameSpan.textContent = node.name;
    liElt.appendChild(nameSpan);
    const visibleButton = document.createElement("button");
    visibleButton.textContent = SupClient.i18n.t("cubicModelEditor:sidebar.nodes.hide");
    visibleButton.classList.add("show");
    visibleButton.addEventListener("click", (event) => {
        event.stopPropagation();
        const { shape } = network_1.data.cubicModelUpdater.cubicModelRenderer.byNodeId[event.target.parentElement.dataset["id"]];
        shape.visible = !shape.visible;
        visibleButton.textContent = SupClient.i18n.t(`cubicModelEditor:sidebar.nodes.${(shape.visible) ? "hide" : "show"}`);
        if (shape.visible)
            visibleButton.classList.add("show");
        else
            visibleButton.classList.remove("show");
    });
    liElt.appendChild(visibleButton);
    return liElt;
}
exports.createNodeElement = createNodeElement;
function onNodesTreeViewDrop(event, dropLocation, orderedNodes) {
    const dropPoint = SupClient.getTreeViewDropPoint(dropLocation, network_1.data.cubicModelUpdater.cubicModelAsset.nodes);
    const nodeIds = [];
    for (const node of orderedNodes)
        nodeIds.push(node.dataset["id"]);
    const sourceParentNode = network_1.data.cubicModelUpdater.cubicModelAsset.nodes.parentNodesById[nodeIds[0]];
    const sourceChildren = (sourceParentNode != null && sourceParentNode.children != null) ? sourceParentNode.children : network_1.data.cubicModelUpdater.cubicModelAsset.nodes.pub;
    const sameParent = (sourceParentNode != null && dropPoint.parentId === sourceParentNode.id);
    let i = 0;
    for (const id of nodeIds) {
        network_1.data.projectClient.editAsset(SupClient.query.asset, "moveNode", id, dropPoint.parentId, dropPoint.index + i);
        if (!sameParent || sourceChildren.indexOf(network_1.data.cubicModelUpdater.cubicModelAsset.nodes.byId[id]) >= dropPoint.index)
            i++;
    }
    return false;
}
function onNodeActivate() { ui.nodesTreeView.selectedNodes[0].classList.toggle("collapsed"); }
function setupSelectedNode() {
    engine_1.setupHelpers();
    // Setup texture area
    const nodeIds = [];
    for (const node of ui.nodesTreeView.selectedNodes)
        nodeIds.push(node.dataset["id"]);
    textureArea_1.setSelectedNode(nodeIds);
    // Setup transform
    const nodeElt = ui.nodesTreeView.selectedNodes[0];
    if (nodeElt == null || ui.nodesTreeView.selectedNodes.length !== 1) {
        ui.inspectorElt.hidden = true;
        ui.renameNodeButton.disabled = true;
        ui.duplicateNodeButton.disabled = true;
        ui.deleteNodeButton.disabled = true;
        return;
    }
    ui.inspectorElt.hidden = false;
    const node = network_1.data.cubicModelUpdater.cubicModelAsset.nodes.byId[nodeElt.dataset["id"]];
    setInspectorPosition(node.position);
    setInspectorOrientation(node.orientation);
    // Setup shape editor
    ui.inspectorFields.shape.type.value = node.shape.type;
    setInspectorShapeOffset(node.shape.offset);
    ui.shapeTbodyElt.hidden = node.shape.type !== "box";
    if (!ui.shapeTbodyElt.hidden) {
        const boxSettings = node.shape.settings;
        setInspectorBoxSize(boxSettings.size);
        setInspectorBoxStretch(boxSettings.stretch);
    }
    // Enable buttons
    ui.renameNodeButton.disabled = false;
    ui.duplicateNodeButton.disabled = false;
    ui.deleteNodeButton.disabled = false;
}
exports.setupSelectedNode = setupSelectedNode;
function roundForInspector(number) { return parseFloat(number.toFixed(3)); }
function setInspectorPosition(position) {
    const values = [
        roundForInspector(position.x).toString(),
        roundForInspector(position.y).toString(),
        roundForInspector(position.z).toString()
    ];
    for (let i = 0; i < 3; i++) {
        // NOTE: This helps avoid clearing selection when possible
        if (ui.inspectorFields.position[i].value !== values[i]) {
            ui.inspectorFields.position[i].value = values[i];
        }
    }
}
exports.setInspectorPosition = setInspectorPosition;
function setInspectorOrientation(orientation) {
    const euler = new THREE.Euler().setFromQuaternion(orientation);
    const values = [
        roundForInspector(THREE.Math.radToDeg(euler.x)).toString(),
        roundForInspector(THREE.Math.radToDeg(euler.y)).toString(),
        roundForInspector(THREE.Math.radToDeg(euler.z)).toString()
    ];
    // Work around weird conversion from quaternion to euler conversion
    if (values[1] === "180" && values[2] === "180") {
        values[0] = roundForInspector(180 - THREE.Math.radToDeg(euler.x)).toString();
        values[1] = "0";
        values[2] = "0";
    }
    for (let i = 0; i < 3; i++) {
        // NOTE: This helps avoid clearing selection when possible
        if (ui.inspectorFields.orientation[i].value !== values[i]) {
            ui.inspectorFields.orientation[i].value = values[i];
        }
    }
}
exports.setInspectorOrientation = setInspectorOrientation;
function setInspectorShapeOffset(offset) {
    const values = [
        roundForInspector(offset.x).toString(),
        roundForInspector(offset.y).toString(),
        roundForInspector(offset.z).toString()
    ];
    for (let i = 0; i < 3; i++) {
        // NOTE: This helps avoid clearing selection when possible
        if (ui.inspectorFields.shape.offset[i].value !== values[i]) {
            ui.inspectorFields.shape.offset[i].value = values[i];
        }
    }
}
exports.setInspectorShapeOffset = setInspectorShapeOffset;
function setInspectorBoxSize(size) {
    const values = [size.x.toString(), size.y.toString(), size.z.toString()];
    for (let i = 0; i < 3; i++) {
        // NOTE: This helps avoid clearing selection when possible
        if (ui.inspectorFields.shape.box.size[i].value !== values[i]) {
            ui.inspectorFields.shape.box.size[i].value = values[i];
        }
    }
}
exports.setInspectorBoxSize = setInspectorBoxSize;
function setInspectorBoxStretch(stretch) {
    const values = [
        roundForInspector(stretch.x).toString(),
        roundForInspector(stretch.y).toString(),
        roundForInspector(stretch.z).toString()
    ];
    for (let i = 0; i < 3; i++) {
        // NOTE: This helps avoid clearing selection when possible
        if (ui.inspectorFields.shape.box.stretch[i].value !== values[i]) {
            ui.inspectorFields.shape.box.stretch[i].value = values[i];
        }
    }
}
exports.setInspectorBoxStretch = setInspectorBoxStretch;
// Transform mode
ui.translateMode = "all";
document.querySelector(".main .controls .transform-mode").addEventListener("click", onTransformModeClick);
document.querySelector(".main .controls .transform-settings").addEventListener("click", onTransformSettingsClick);
function onTransformModeClick(event) {
    const target = event.target;
    if (target.tagName !== "INPUT")
        return;
    if (target.id === "transform-space") {
        engine_1.default.transformHandleComponent.setSpace(target.checked ? "local" : "world");
    }
    else {
        const transformSpaceCheckbox = document.getElementById("transform-space");
        transformSpaceCheckbox.disabled = target.value === "scale";
        engine_1.default.transformHandleComponent.setMode(target.value);
        if (target.value === "translate") {
            ui.translateMode = target.dataset["target"];
            const linkShapeToPivot = document.getElementById("translate-pivot-shape").checked;
            if (ui.translateMode === "pivot" && linkShapeToPivot)
                ui.translateMode = "all";
        }
    }
    engine_1.setupHelpers();
}
function onTransformSettingsClick(event) {
    const target = event.target;
    if (target.tagName !== "INPUT")
        return;
    if (target.id === "transform-space") {
        engine_1.default.transformHandleComponent.setSpace(target.checked ? "local" : "world");
    }
    else if (target.id === "translate-pivot-shape") {
        const linkShapeToPivot = document.getElementById("translate-pivot-shape").checked;
        if (ui.translateMode === "pivot" && linkShapeToPivot)
            ui.translateMode = "all";
        else if (ui.translateMode === "all" && !linkShapeToPivot)
            ui.translateMode = "pivot";
    }
}
// Node buttons
ui.newNodeButton = document.querySelector("button.new-node");
ui.newNodeButton.addEventListener("click", onNewNodeClick);
ui.renameNodeButton = document.querySelector("button.rename-node");
ui.renameNodeButton.addEventListener("click", onRenameNodeClick);
ui.duplicateNodeButton = document.querySelector("button.duplicate-node");
ui.duplicateNodeButton.addEventListener("click", onDuplicateNodeClick);
ui.deleteNodeButton = document.querySelector("button.delete-node");
ui.deleteNodeButton.addEventListener("click", onDeleteNodeClick);
// Inspector
ui.inspectorElt = document.querySelector(".inspector");
ui.shapeTbodyElt = ui.inspectorElt.querySelector(".box-shape");
ui.inspectorFields = {
    position: ui.inspectorElt.querySelectorAll(".transform .position input"),
    orientation: ui.inspectorElt.querySelectorAll(".transform .orientation input"),
    shape: {
        type: ui.inspectorElt.querySelector(".shape .type select"),
        offset: ui.inspectorElt.querySelectorAll(".shape .offset input"),
        box: {
            size: ui.inspectorElt.querySelectorAll(".box-shape .size input"),
            stretch: ui.inspectorElt.querySelectorAll(".box-shape .stretch input")
        }
    }
};
for (const input of ui.inspectorFields.position)
    input.addEventListener("change", onInspectorInputChange);
for (const input of ui.inspectorFields.orientation)
    input.addEventListener("change", onInspectorInputChange);
for (const input of ui.inspectorFields.shape.offset)
    input.addEventListener("change", onInspectorInputChange);
for (const input of ui.inspectorFields.shape.box.size)
    input.addEventListener("change", onInspectorInputChange);
for (const input of ui.inspectorFields.shape.box.stretch)
    input.addEventListener("change", onInspectorInputChange);
function onNewNodeClick() {
    // TODO: Allow choosing shape and default texture color
    const options = {
        initialValue: "Node",
        validationLabel: SupClient.i18n.t("common:actions.create")
    };
    new SupClient.Dialogs.PromptDialog(SupClient.i18n.t("cubicModelEditor:sidebar.nodes.newNode.prompt"), options, (name) => {
        if (name == null)
            return;
        const options = SupClient.getTreeViewInsertionPoint(ui.nodesTreeView);
        const quaternion = new THREE.Quaternion();
        engine_1.default.cameraActor.getGlobalOrientation(quaternion);
        const offset = new THREE.Vector3(0, 0, -10).applyQuaternion(quaternion);
        const position = new THREE.Vector3();
        engine_1.default.cameraActor.getGlobalPosition(position).add(offset);
        const pixelsPerunit = network_1.data.cubicModelUpdater.cubicModelAsset.pub.pixelsPerUnit;
        if (options.parentId != null) {
            const inverseParentMatrix = new THREE.Matrix4().getInverse(network_1.data.cubicModelUpdater.cubicModelRenderer.byNodeId[options.parentId].pivot.matrixWorld);
            position.applyMatrix4(inverseParentMatrix);
        }
        else {
            position.multiplyScalar(pixelsPerunit);
        }
        options.transform = { position };
        options.shape = {
            type: "box",
            offset: { x: 0, y: 0, z: 0 },
            settings: {
                size: { x: pixelsPerunit, y: pixelsPerunit, z: pixelsPerunit },
                stretch: { x: 1, y: 1, z: 1 }
            }
        };
        network_1.data.projectClient.editAsset(SupClient.query.asset, "addNode", name, options, (nodeId) => {
            ui.nodesTreeView.clearSelection();
            ui.nodesTreeView.addToSelection(ui.nodesTreeView.treeRoot.querySelector(`li[data-id='${nodeId}']`));
            setupSelectedNode();
        });
    });
}
function onRenameNodeClick() {
    if (ui.nodesTreeView.selectedNodes.length !== 1)
        return;
    const selectedNode = ui.nodesTreeView.selectedNodes[0];
    const node = network_1.data.cubicModelUpdater.cubicModelAsset.nodes.byId[selectedNode.dataset["id"]];
    const options = {
        initialValue: node.name,
        validationLabel: SupClient.i18n.t("common:actions.rename")
    };
    new SupClient.Dialogs.PromptDialog(SupClient.i18n.t("cubicModelEditor:sidebar.nodes.renamePrompt"), options, (newName) => {
        if (newName == null)
            return;
        network_1.data.projectClient.editAsset(SupClient.query.asset, "setNodeProperty", node.id, "name", newName);
    });
}
function onDuplicateNodeClick() {
    if (ui.nodesTreeView.selectedNodes.length !== 1)
        return;
    const selectedNode = ui.nodesTreeView.selectedNodes[0];
    const node = network_1.data.cubicModelUpdater.cubicModelAsset.nodes.byId[selectedNode.dataset["id"]];
    const options = {
        initialValue: node.name,
        validationLabel: SupClient.i18n.t("common:actions.duplicate")
    };
    new SupClient.Dialogs.PromptDialog(SupClient.i18n.t("cubicModelEditor:sidebar.nodes.duplicatePrompt"), options, (newName) => {
        if (newName == null)
            return;
        const options = SupClient.getTreeViewInsertionPoint(ui.nodesTreeView);
        network_1.data.projectClient.editAsset(SupClient.query.asset, "duplicateNode", newName, node.id, options.index, (nodeId) => {
            ui.nodesTreeView.clearSelection();
            ui.nodesTreeView.addToSelection(ui.nodesTreeView.treeRoot.querySelector(`li[data-id='${nodeId}']`));
            setupSelectedNode();
        });
    });
}
function onDeleteNodeClick() {
    if (ui.nodesTreeView.selectedNodes.length === 0)
        return;
    const confirmLabel = SupClient.i18n.t("cubicModelEditor:sidebar.nodes.deleteConfirm");
    const validationLabel = SupClient.i18n.t("common:actions.delete");
    new SupClient.Dialogs.ConfirmDialog(confirmLabel, { validationLabel }, (confirm) => {
        if (!confirm)
            return;
        for (const selectedNode of ui.nodesTreeView.selectedNodes) {
            network_1.data.projectClient.editAsset(SupClient.query.asset, "removeNode", selectedNode.dataset["id"]);
        }
    });
}
function onInspectorInputChange(event) {
    if (ui.nodesTreeView.selectedNodes.length !== 1)
        return;
    const nodeId = ui.nodesTreeView.selectedNodes[0].dataset["id"];
    // transform, shape or box-shape
    const context = event.target.parentElement.parentElement.parentElement.parentElement.className;
    let path;
    let uiFields;
    if (context === "transform") {
        path = "";
        uiFields = ui.inspectorFields;
    }
    else if (context === "shape") {
        path = "shape.";
        uiFields = ui.inspectorFields.shape;
    }
    else if (context === "box-shape") {
        path = "shape.settings.";
        uiFields = ui.inspectorFields.shape.box;
    }
    else
        throw new Error("Unsupported inspector input context");
    const propertyType = event.target.parentElement.parentElement.parentElement.className;
    let value;
    if (context === "shape" && propertyType === "type") {
        // Single value
        value = uiFields[propertyType].value;
    }
    else {
        // Multiple values
        const inputs = uiFields[propertyType];
        value = {
            x: parseFloat(inputs[0].value),
            y: parseFloat(inputs[1].value),
            z: parseFloat(inputs[2].value),
        };
        if (propertyType === "orientation") {
            const euler = new THREE.Euler(THREE.Math.degToRad(value.x), THREE.Math.degToRad(value.y), THREE.Math.degToRad(value.z));
            const quaternion = new THREE.Quaternion().setFromEuler(euler);
            value = { x: quaternion.x, y: quaternion.y, z: quaternion.z, w: quaternion.w };
        }
    }
    if (propertyType !== "position" || ui.translateMode !== "pivot")
        network_1.data.projectClient.editAsset(SupClient.query.asset, "setNodeProperty", nodeId, `${path}${propertyType}`, value);
    else
        network_1.data.projectClient.editAsset(SupClient.query.asset, "moveNodePivot", nodeId, value);
}
