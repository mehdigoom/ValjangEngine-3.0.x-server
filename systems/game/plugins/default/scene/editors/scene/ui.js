"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const network_1 = require("./network");
const engine_1 = require("./engine");
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
        event.stopPropagation();
        onNewNodeClick();
    }
    if (event.keyCode === 80 && (event.ctrlKey || event.metaKey)) { // Ctrl+P
        event.preventDefault();
        event.stopPropagation();
        onNewPrefabClick();
    }
    if (event.keyCode === 113) { // F2
        event.preventDefault();
        event.stopPropagation();
        onRenameNodeClick();
    }
    if (event.keyCode === 68 && (event.ctrlKey || event.metaKey)) { // Ctrl+D
        event.preventDefault();
        event.stopPropagation();
        onDuplicateNodeClick();
    }
    if (event.keyCode === 46) { // Delete
        event.preventDefault();
        event.stopPropagation();
        onDeleteNodeClick();
    }
});
const ignoredTagNames = ["INPUT", "TEXTAREA", "SELECT", "BUTTON"];
document.addEventListener("keydown", (event) => {
    if (document.querySelector("body > .dialog") != null)
        return;
    if (ignoredTagNames.indexOf(event.target.tagName) !== -1)
        return;
    switch (event.keyCode) {
        case window.KeyEvent.DOM_VK_E:
            document.getElementById(`transform-mode-translate`).checked = true;
            engine_1.default.transformHandleComponent.setMode("translate");
            break;
        case window.KeyEvent.DOM_VK_R:
            document.getElementById(`transform-mode-rotate`).checked = true;
            engine_1.default.transformHandleComponent.setMode("rotate");
            break;
        case window.KeyEvent.DOM_VK_T:
            document.getElementById(`transform-mode-scale`).checked = true;
            engine_1.default.transformHandleComponent.setMode("scale");
            break;
        case window.KeyEvent.DOM_VK_L:
            const localElt = document.getElementById(`transform-space`);
            localElt.checked = !localElt.checked;
            engine_1.default.transformHandleComponent.setSpace(localElt.checked ? "local" : "world");
            break;
        case window.KeyEvent.DOM_VK_G:
            ui.gridCheckbox.checked = !ui.gridCheckbox.checked;
            engine_1.default.gridHelperComponent.setVisible(ui.gridCheckbox.checked);
            break;
        case window.KeyEvent.DOM_VK_F:
            if (ui.nodesTreeView.selectedNodes.length !== 1)
                return;
            const nodeId = ui.nodesTreeView.selectedNodes[0].dataset["id"];
            engine_1.focusActor(nodeId);
            break;
    }
});
ui.canvasElt = document.querySelector("canvas");
ui.actorDropElt = document.querySelector(".render-area .drop-asset-container");
ui.componentDropElt = document.querySelector(".transform-area .drop-asset-container");
// Setup resizable panes
new ResizeHandle(document.querySelector(".sidebar"), "right");
new ResizeHandle(document.querySelector(".nodes-tree-view"), "top");
// Setup tree view
ui.treeViewElt = document.querySelector(".nodes-tree-view");
ui.nodesTreeView = new TreeView(ui.treeViewElt, { dragStartCallback: () => true, dropCallback: onNodesTreeViewDrop });
ui.nodesTreeView.on("activate", onNodeActivate);
ui.nodesTreeView.on("selectionChange", () => { setupSelectedNode(); });
ui.newActorButton = document.querySelector("button.new-actor");
ui.newActorButton.addEventListener("click", onNewNodeClick);
ui.newPrefabButton = document.querySelector("button.new-prefab");
ui.newPrefabButton.addEventListener("click", onNewPrefabClick);
ui.renameNodeButton = document.querySelector("button.rename-node");
ui.renameNodeButton.addEventListener("click", onRenameNodeClick);
ui.duplicateNodeButton = document.querySelector("button.duplicate-node");
ui.duplicateNodeButton.addEventListener("click", onDuplicateNodeClick);
ui.deleteNodeButton = document.querySelector("button.delete-node");
ui.deleteNodeButton.addEventListener("click", onDeleteNodeClick);
// Inspector
ui.inspectorElt = document.querySelector(".inspector");
ui.inspectorTbodyElt = ui.inspectorElt.querySelector("tbody");
ui.transform = {
    positionElts: ui.inspectorElt.querySelectorAll(".transform .position input"),
    orientationElts: ui.inspectorElt.querySelectorAll(".transform .orientation input"),
    scaleElts: ui.inspectorElt.querySelectorAll(".transform .scale input"),
};
ui.visibleCheckbox = ui.inspectorElt.querySelector(".visible input");
ui.visibleCheckbox.addEventListener("change", onVisibleChange);
ui.layerSelect = ui.inspectorElt.querySelector(".layer select");
ui.layerSelect.addEventListener("change", onLayerChange);
ui.prefabRow = ui.inspectorElt.querySelector(".prefab");
ui.prefabInput = ui.inspectorElt.querySelector(".prefab input");
ui.prefabInput.addEventListener("input", onPrefabInput);
ui.prefabOpenElt = ui.inspectorElt.querySelector(".prefab button");
ui.prefabOpenElt.addEventListener("click", (event) => {
    const selectedNode = ui.nodesTreeView.selectedNodes[0];
    const node = network_1.data.sceneUpdater.sceneAsset.nodes.byId[selectedNode.dataset["id"]];
    const id = node.prefab.sceneAssetId;
    SupClient.openEntry(id);
});
for (const transformType in ui.transform) {
    const inputs = ui.transform[transformType];
    for (const input of inputs)
        input.addEventListener("change", onTransformInputChange);
}
ui.newComponentButton = document.querySelector("button.new-component");
ui.newComponentButton.addEventListener("click", onNewComponentClick);
ui.cameraMode = "3D";
ui.cameraModeButton = document.getElementById("toggle-camera-button");
ui.cameraModeButton.addEventListener("click", onChangeCameraMode);
ui.cameraVerticalAxis = "Y";
ui.cameraVerticalAxisButton = document.getElementById("toggle-camera-vertical-axis");
ui.cameraVerticalAxisButton.addEventListener("click", onChangeCameraVerticalAxis);
ui.cameraSpeedSlider = document.getElementById("camera-speed-slider");
ui.cameraSpeedSlider.addEventListener("input", onChangeCameraSpeed);
ui.cameraSpeedSlider.value = engine_1.default.cameraControls.movementSpeed;
ui.camera2DZ = document.getElementById("camera-2d-z");
ui.camera2DZ.addEventListener("input", onChangeCamera2DZ);
document.querySelector(".main .controls .transform-mode").addEventListener("click", onTransformModeClick);
ui.componentsElt = ui.inspectorElt.querySelector(".components");
ui.availableComponents = {};
let componentEditorPlugins;
function start() {
    componentEditorPlugins = SupClient.getPlugins("componentEditors");
    SupClient.setupHelpCallback(() => {
        window.parent.postMessage({ type: "openTool", name: "documentation", state: { section: "scene" } }, window.location.origin);
    });
    const componentTypes = Object.keys(componentEditorPlugins);
    componentTypes.sort((a, b) => {
        const componentLabelA = SupClient.i18n.t(`componentEditors:${a}.label`);
        const componentLabelB = SupClient.i18n.t(`componentEditors:${b}.label`);
        return componentLabelA.localeCompare(componentLabelB);
    });
    for (const componentType of componentTypes)
        ui.availableComponents[componentType] = SupClient.i18n.t(`componentEditors:${componentType}.label`);
    document.addEventListener("dragover", onDragOver);
    document.addEventListener("drop", onStopDrag);
    ui.actorDropElt.addEventListener("dragenter", onActorDragEnter);
    ui.actorDropElt.addEventListener("dragleave", onActorDragLeave);
    ui.actorDropElt.addEventListener("drop", onActorDrop);
    ui.componentDropElt.addEventListener("dragenter", onComponentDragEnter);
    ui.componentDropElt.addEventListener("dragleave", onComponentDragLeave);
    ui.componentDropElt.addEventListener("drop", onComponentDrop);
    document.querySelector(".main .loading").hidden = true;
    document.querySelector(".main .controls").hidden = false;
    document.querySelector(".render-area").hidden = false;
    ui.newActorButton.disabled = false;
    ui.newPrefabButton.disabled = false;
}
exports.start = start;
// Transform
function onTransformModeClick(event) {
    if (event.target.tagName !== "INPUT")
        return;
    if (event.target.id === "transform-space") {
        engine_1.default.transformHandleComponent.setSpace(event.target.checked ? "local" : "world");
    }
    else {
        const transformSpaceCheckbox = document.getElementById("transform-space");
        transformSpaceCheckbox.disabled = event.target.value === "scale";
        engine_1.default.transformHandleComponent.setMode(event.target.value);
    }
}
// Grid
ui.gridCheckbox = document.getElementById("grid-visible");
ui.gridCheckbox.addEventListener("change", onGridVisibleChange);
ui.gridSize = 80;
ui.gridStep = 1;
document.getElementById("grid-step").addEventListener("input", onGridStepInput);
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
// Light
document.getElementById("show-light").addEventListener("change", (event) => {
    if (event.target.checked)
        engine_1.default.gameInstance.threeScene.add(engine_1.default.ambientLight);
    else
        engine_1.default.gameInstance.threeScene.remove(engine_1.default.ambientLight);
});
function createNodeElement(node) {
    const liElt = document.createElement("li");
    liElt.dataset["id"] = node.id;
    const nameSpan = document.createElement("span");
    nameSpan.classList.add("name");
    if (node.prefab != null)
        nameSpan.classList.add("prefab");
    nameSpan.textContent = node.name;
    liElt.appendChild(nameSpan);
    const visibleButton = document.createElement("button");
    visibleButton.textContent = SupClient.i18n.t("sceneEditor:treeView.visible.hide");
    visibleButton.classList.add("show");
    visibleButton.addEventListener("click", (event) => {
        event.stopPropagation();
        const actor = network_1.data.sceneUpdater.bySceneNodeId[event.target.parentElement.dataset["id"]].actor;
        actor.threeObject.visible = !actor.threeObject.visible;
        const visible = actor.threeObject.visible ? "hide" : "show";
        visibleButton.textContent = SupClient.i18n.t(`sceneEditor:treeView.visible.${visible}`);
        if (actor.threeObject.visible)
            visibleButton.classList.add("show");
        else
            visibleButton.classList.remove("show");
    });
    liElt.appendChild(visibleButton);
    return liElt;
}
exports.createNodeElement = createNodeElement;
function onNodesTreeViewDrop(event, dropLocation, orderedNodes) {
    if (orderedNodes == null)
        return false;
    const dropPoint = SupClient.getTreeViewDropPoint(dropLocation, network_1.data.sceneUpdater.sceneAsset.nodes);
    const nodeIds = [];
    for (const node of orderedNodes)
        nodeIds.push(node.dataset["id"]);
    const sourceParentNode = network_1.data.sceneUpdater.sceneAsset.nodes.parentNodesById[nodeIds[0]];
    const sourceChildren = (sourceParentNode != null && sourceParentNode.children != null) ? sourceParentNode.children : network_1.data.sceneUpdater.sceneAsset.nodes.pub;
    const sameParent = (sourceParentNode != null && dropPoint.parentId === sourceParentNode.id);
    let i = 0;
    for (const id of nodeIds) {
        network_1.data.projectClient.editAsset(SupClient.query.asset, "moveNode", id, dropPoint.parentId, dropPoint.index + i);
        if (!sameParent || sourceChildren.indexOf(network_1.data.sceneUpdater.sceneAsset.nodes.byId[id]) >= dropPoint.index)
            i++;
    }
    return false;
}
function onNodeActivate() {
    // Focus an actor by double clicking on treeview
    if (ui.nodesTreeView.selectedNodes.length !== 1)
        return;
    const nodeId = ui.nodesTreeView.selectedNodes[0].dataset["id"];
    engine_1.focusActor(nodeId);
}
function setupSelectedNode() {
    engine_1.setupHelpers();
    // Clear component editors
    for (const componentId in ui.componentEditors)
        ui.componentEditors[componentId].destroy();
    ui.componentEditors = {};
    // Setup transform
    const nodeElt = ui.nodesTreeView.selectedNodes[0];
    if (nodeElt == null || ui.nodesTreeView.selectedNodes.length !== 1) {
        ui.inspectorElt.hidden = true;
        ui.newActorButton.disabled = false;
        ui.newPrefabButton.disabled = false;
        ui.renameNodeButton.disabled = true;
        ui.duplicateNodeButton.disabled = true;
        ui.deleteNodeButton.disabled = true;
        return;
    }
    ui.inspectorElt.hidden = false;
    const node = network_1.data.sceneUpdater.sceneAsset.nodes.byId[nodeElt.dataset["id"]];
    setInspectorPosition(node.position);
    setInspectorOrientation(node.orientation);
    setInspectorScale(node.scale);
    ui.visibleCheckbox.checked = node.visible;
    ui.layerSelect.value = node.layer.toString();
    // If it's a prefab, disable various buttons
    const isPrefab = node.prefab != null;
    ui.newActorButton.disabled = isPrefab;
    ui.newPrefabButton.disabled = isPrefab;
    ui.renameNodeButton.disabled = false;
    ui.duplicateNodeButton.disabled = false;
    ui.deleteNodeButton.disabled = false;
    if (isPrefab) {
        if (ui.prefabRow.parentElement == null)
            ui.inspectorTbodyElt.appendChild(ui.prefabRow);
        setInspectorPrefabScene(node.prefab.sceneAssetId);
    }
    else if (ui.prefabRow.parentElement != null)
        ui.inspectorTbodyElt.removeChild(ui.prefabRow);
    // Setup component editors
    ui.componentsElt.innerHTML = "";
    for (const component of node.components) {
        const componentElt = createComponentElement(node.id, component);
        ui.componentsElt.appendChild(componentElt);
    }
    ui.newComponentButton.disabled = isPrefab;
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
        if (ui.transform.positionElts[i].value !== values[i]) {
            ui.transform.positionElts[i].value = values[i];
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
        if (ui.transform.orientationElts[i].value !== values[i]) {
            ui.transform.orientationElts[i].value = values[i];
        }
    }
}
exports.setInspectorOrientation = setInspectorOrientation;
function setInspectorScale(scale) {
    const values = [
        roundForInspector(scale.x).toString(),
        roundForInspector(scale.y).toString(),
        roundForInspector(scale.z).toString()
    ];
    for (let i = 0; i < 3; i++) {
        // NOTE: This helps avoid clearing selection when possible
        if (ui.transform.scaleElts[i].value !== values[i]) {
            ui.transform.scaleElts[i].value = values[i];
        }
    }
}
exports.setInspectorScale = setInspectorScale;
function setInspectorVisible(visible) {
    ui.visibleCheckbox.checked = visible;
}
exports.setInspectorVisible = setInspectorVisible;
function setInspectorLayer(layer) {
    ui.layerSelect.value = layer.toString();
}
exports.setInspectorLayer = setInspectorLayer;
function setupInspectorLayers() {
    while (ui.layerSelect.childElementCount > network_1.data.gameSettingsResource.pub.customLayers.length + 1)
        ui.layerSelect.removeChild(ui.layerSelect.lastElementChild);
    let optionElt = ui.layerSelect.firstElementChild.nextElementSibling;
    for (let i = 0; i < network_1.data.gameSettingsResource.pub.customLayers.length; i++) {
        if (optionElt == null) {
            optionElt = document.createElement("option");
            ui.layerSelect.appendChild(optionElt);
        }
        optionElt.value = (i + 1).toString(); // + 1 because "Default" is 0
        optionElt.textContent = network_1.data.gameSettingsResource.pub.customLayers[i];
        optionElt = optionElt.nextElementSibling;
    }
}
exports.setupInspectorLayers = setupInspectorLayers;
function setInspectorPrefabScene(sceneAssetId) {
    if (sceneAssetId != null && network_1.data.projectClient.entries.byId[sceneAssetId] != null) {
        ui.prefabInput.value = network_1.data.projectClient.entries.getPathFromId(sceneAssetId);
        ui.prefabOpenElt.disabled = false;
    }
    else {
        ui.prefabInput.value = "";
        ui.prefabOpenElt.disabled = true;
    }
}
exports.setInspectorPrefabScene = setInspectorPrefabScene;
function onNewNodeClick() {
    const options = {
        initialValue: SupClient.i18n.t("sceneEditor:treeView.newActor.initialValue"),
        validationLabel: SupClient.i18n.t("common:actions.create"),
        pattern: SupClient.namePattern,
        title: SupClient.i18n.t("common:namePatternDescription")
    };
    new SupClient.Dialogs.PromptDialog(SupClient.i18n.t("sceneEditor:treeView.newActor.prompt"), options, (name) => {
        if (name == null)
            return;
        createNewNode(name, false);
    });
}
function onNewPrefabClick() {
    const options = {
        initialValue: SupClient.i18n.t("sceneEditor:treeView.newPrefab.initialValue"),
        validationLabel: SupClient.i18n.t("common:actions.create"),
        pattern: SupClient.namePattern,
        title: SupClient.i18n.t("common:namePatternDescription")
    };
    new SupClient.Dialogs.PromptDialog(SupClient.i18n.t("sceneEditor:treeView.newPrefab.prompt"), options, (name) => {
        if (name == null)
            return;
        createNewNode(name, true);
    });
}
function createNewNode(name, prefab) {
    const options = SupClient.getTreeViewInsertionPoint(ui.nodesTreeView);
    const offset = new THREE.Vector3(0, 0, -10).applyQuaternion(engine_1.default.cameraActor.getGlobalOrientation(new THREE.Quaternion()));
    const position = new THREE.Vector3();
    engine_1.default.cameraActor.getGlobalPosition(position).add(offset);
    if (options.parentId != null) {
        const parentMatrix = network_1.data.sceneUpdater.bySceneNodeId[options.parentId].actor.getGlobalMatrix(new THREE.Matrix4());
        position.applyMatrix4(parentMatrix.getInverse(parentMatrix));
    }
    options.transform = { position };
    options.prefab = prefab;
    network_1.data.projectClient.editAsset(SupClient.query.asset, "addNode", name, options, (nodeId) => {
        ui.nodesTreeView.clearSelection();
        ui.nodesTreeView.addToSelection(ui.nodesTreeView.treeRoot.querySelector(`li[data-id='${nodeId}']`));
        setupSelectedNode();
    });
}
function onRenameNodeClick() {
    if (ui.nodesTreeView.selectedNodes.length !== 1)
        return;
    const selectedNode = ui.nodesTreeView.selectedNodes[0];
    const node = network_1.data.sceneUpdater.sceneAsset.nodes.byId[selectedNode.dataset["id"]];
    const options = {
        initialValue: node.name,
        validationLabel: SupClient.i18n.t("common:actions.rename"),
        pattern: SupClient.namePattern,
        title: SupClient.i18n.t("common:namePatternDescription")
    };
    new SupClient.Dialogs.PromptDialog(SupClient.i18n.t("sceneEditor:treeView.renamePrompt"), options, (newName) => {
        if (newName == null)
            return;
        network_1.data.projectClient.editAsset(SupClient.query.asset, "setNodeProperty", node.id, "name", newName);
    });
}
function onDuplicateNodeClick() {
    if (ui.nodesTreeView.selectedNodes.length !== 1)
        return;
    const selectedNode = ui.nodesTreeView.selectedNodes[0];
    const node = network_1.data.sceneUpdater.sceneAsset.nodes.byId[selectedNode.dataset["id"]];
    const options = {
        initialValue: node.name,
        validationLabel: SupClient.i18n.t("common:actions.duplicate"),
        pattern: SupClient.namePattern,
        title: SupClient.i18n.t("common:namePatternDescription")
    };
    new SupClient.Dialogs.PromptDialog(SupClient.i18n.t("sceneEditor:treeView.duplicatePrompt"), options, (newName) => {
        if (newName == null)
            return;
        const options = SupClient.getTreeViewSiblingInsertionPoint(ui.nodesTreeView);
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
    const confirmLabel = SupClient.i18n.t("sceneEditor:treeView.deleteConfirm");
    const validationLabel = SupClient.i18n.t("common:actions.delete");
    new SupClient.Dialogs.ConfirmDialog(confirmLabel, { validationLabel }, (confirm) => {
        if (!confirm)
            return;
        for (const selectedNode of ui.nodesTreeView.selectedNodes) {
            network_1.data.projectClient.editAsset(SupClient.query.asset, "removeNode", selectedNode.dataset["id"]);
        }
    });
}
function onTransformInputChange(event) {
    if (ui.nodesTreeView.selectedNodes.length !== 1)
        return;
    const transformType = event.target.parentElement.parentElement.parentElement.className;
    const inputs = ui.transform[`${transformType}Elts`];
    let value = {
        x: parseFloat(inputs[0].value),
        y: parseFloat(inputs[1].value),
        z: parseFloat(inputs[2].value),
    };
    if (transformType === "orientation") {
        const euler = new THREE.Euler(THREE.Math.degToRad(value.x), THREE.Math.degToRad(value.y), THREE.Math.degToRad(value.z));
        const quaternion = new THREE.Quaternion().setFromEuler(euler);
        value = { x: quaternion.x, y: quaternion.y, z: quaternion.z, w: quaternion.w };
    }
    const nodeId = ui.nodesTreeView.selectedNodes[0].dataset["id"];
    network_1.data.projectClient.editAsset(SupClient.query.asset, "setNodeProperty", nodeId, transformType, value);
}
function onVisibleChange(event) {
    if (ui.nodesTreeView.selectedNodes.length !== 1)
        return;
    const nodeId = ui.nodesTreeView.selectedNodes[0].dataset["id"];
    network_1.data.projectClient.editAsset(SupClient.query.asset, "setNodeProperty", nodeId, "visible", event.target.checked);
}
function onLayerChange(event) {
    if (ui.nodesTreeView.selectedNodes.length !== 1)
        return;
    const nodeId = ui.nodesTreeView.selectedNodes[0].dataset["id"];
    network_1.data.projectClient.editAsset(SupClient.query.asset, "setNodeProperty", nodeId, "layer", parseInt(event.target.value, 10));
}
function onPrefabInput(event) {
    if (ui.nodesTreeView.selectedNodes.length !== 1)
        return;
    const nodeId = ui.nodesTreeView.selectedNodes[0].dataset["id"];
    if (event.target.value === "") {
        network_1.data.projectClient.editAsset(SupClient.query.asset, "setNodeProperty", nodeId, "prefab.sceneAssetId", null);
    }
    else {
        const entry = SupClient.findEntryByPath(network_1.data.projectClient.entries.pub, event.target.value);
        if (entry != null && entry.type === "scene") {
            network_1.data.projectClient.editAsset(SupClient.query.asset, "setNodeProperty", nodeId, "prefab.sceneAssetId", entry.id);
        }
    }
}
function createComponentElement(nodeId, component) {
    const componentElt = document.createElement("div");
    componentElt.dataset["componentId"] = component.id;
    const template = document.getElementById("component-cartridge-template");
    const clone = document.importNode(template.content, true);
    clone.querySelector(".type").textContent = SupClient.i18n.t(`componentEditors:${component.type}.label`);
    const table = clone.querySelector(".settings");
    const editConfig = (command, ...args) => {
        let callback = (err) => {
            if (err != null)
                new SupClient.Dialogs.InfoDialog(err);
        };
        // Override callback if one is given
        let lastArg = args[args.length - 1];
        if (typeof lastArg === "function")
            callback = args.pop();
        // Prevent setting a NaN value
        if (command === "setProperty" && typeof args[1] === "number" && isNaN(args[1]))
            return;
        network_1.data.projectClient.editAsset(SupClient.query.asset, "editComponent", nodeId, component.id, command, ...args, callback);
    };
    const componentEditorPlugin = componentEditorPlugins[component.type].content;
    ui.componentEditors[component.id] = new componentEditorPlugin(table.querySelector("tbody"), component.config, network_1.data.projectClient, editConfig);
    const shrinkButton = clone.querySelector(".shrink-component");
    shrinkButton.addEventListener("click", () => {
        if (table.style.display === "none") {
            table.style.display = "";
            shrinkButton.textContent = "–";
        }
        else {
            table.style.display = "none";
            shrinkButton.textContent = "+";
        }
    });
    clone.querySelector(".delete-component").addEventListener("click", onDeleteComponentClick);
    componentElt.appendChild(clone);
    return componentElt;
}
exports.createComponentElement = createComponentElement;
function onNewComponentClick() {
    const selectLabel = SupClient.i18n.t("sceneEditor:inspector.newComponent.select");
    const validationLabel = SupClient.i18n.t("sceneEditor:inspector.newComponent.validate");
    new SupClient.Dialogs.SelectDialog(selectLabel, ui.availableComponents, { validationLabel, size: 12 }, (type) => {
        if (type == null)
            return;
        const nodeId = ui.nodesTreeView.selectedNodes[0].dataset["id"];
        network_1.data.projectClient.editAsset(SupClient.query.asset, "addComponent", nodeId, type, null);
    });
}
function onDeleteComponentClick(event) {
    const confirmLabel = SupClient.i18n.t("sceneEditor:inspector.deleteComponent.confirm");
    const validationLabel = SupClient.i18n.t("sceneEditor:inspector.deleteComponent.validate");
    new SupClient.Dialogs.ConfirmDialog(confirmLabel, { validationLabel }, (confirm) => {
        if (!confirm)
            return;
        const nodeId = ui.nodesTreeView.selectedNodes[0].dataset["id"];
        const componentId = event.target.parentElement.parentElement.dataset["componentId"];
        network_1.data.projectClient.editAsset(SupClient.query.asset, "removeComponent", nodeId, componentId);
    });
}
function setCameraMode(mode) {
    engine_1.default.gameInstance.destroyComponent(engine_1.default.cameraControls);
    ui.cameraMode = mode;
    document.querySelector(".controls .camera-vertical-axis").hidden = ui.cameraMode !== "3D";
    document.querySelector(".controls .camera-speed").hidden = ui.cameraMode !== "3D";
    document.querySelector(".controls .camera-2d-z").hidden = ui.cameraMode === "3D";
    const axis = ui.cameraMode === "3D" ? ui.cameraVerticalAxis : "Y";
    engine_1.default.cameraRoot.setLocalEulerAngles(new THREE.Euler(axis === "Y" ? 0 : Math.PI / 2, 0, 0));
    engine_1.updateCameraMode();
    ui.cameraModeButton.textContent = ui.cameraMode;
}
exports.setCameraMode = setCameraMode;
function onChangeCameraMode(event) {
    setCameraMode(ui.cameraMode === "3D" ? "2D" : "3D");
}
function setCameraVerticalAxis(axis) {
    ui.cameraVerticalAxis = axis;
    engine_1.default.cameraRoot.setLocalEulerAngles(new THREE.Euler(axis === "Y" ? 0 : Math.PI / 2, 0, 0));
    ui.cameraVerticalAxisButton.textContent = axis;
}
exports.setCameraVerticalAxis = setCameraVerticalAxis;
function onChangeCameraVerticalAxis(event) {
    setCameraVerticalAxis(ui.cameraVerticalAxis === "Y" ? "Z" : "Y");
}
function onChangeCameraSpeed() {
    engine_1.default.cameraControls.movementSpeed = ui.cameraSpeedSlider.value;
}
function onChangeCamera2DZ() {
    const z = parseFloat(ui.camera2DZ.value);
    if (isNaN(z))
        return;
    engine_1.default.cameraActor.threeObject.position.setZ(z);
    engine_1.default.cameraActor.threeObject.updateMatrixWorld(false);
}
// Drag'n'drop
function onDragOver(event) {
    if (network_1.data == null || network_1.data.projectClient.entries == null)
        return;
    // NOTE: We can't use event.dataTransfer.getData() to do an early check here
    // because of browser security restrictions
    ui.actorDropElt.hidden = false;
    if (ui.nodesTreeView.selectedNodes.length === 1) {
        const nodeId = ui.nodesTreeView.selectedNodes[0].dataset["id"];
        const node = network_1.data.sceneUpdater.sceneAsset.nodes.byId[nodeId];
        if (node.prefab == null)
            ui.componentDropElt.hidden = false;
    }
    // Ensure we're not hovering the nodes tree view or component area
    let ancestorElt = event.target.parentElement;
    let preventDefaultBehavior = true;
    while (ancestorElt != null) {
        if (ancestorElt === ui.componentsElt || ancestorElt === ui.treeViewElt || (ui.componentDropElt.hidden && ancestorElt === ui.prefabRow)) {
            preventDefaultBehavior = false;
            break;
        }
        ancestorElt = ancestorElt.parentElement;
    }
    if (preventDefaultBehavior)
        event.preventDefault();
    if (ui.dropTimeout != null)
        clearTimeout(ui.dropTimeout);
    ui.dropTimeout = setTimeout(() => { onStopDrag(); }, 300);
}
function onStopDrag() {
    if (ui.dropTimeout != null) {
        clearTimeout(ui.dropTimeout);
        ui.dropTimeout = null;
    }
    ui.actorDropElt.hidden = true;
    ui.actorDropElt.querySelector(".drop-asset-text").classList.toggle("can-drop", false);
    ui.componentDropElt.hidden = true;
    ui.componentDropElt.querySelector(".drop-asset-text").classList.toggle("can-drop", false);
}
function onActorDragEnter(event) { ui.actorDropElt.querySelector(".drop-asset-text").classList.toggle("can-drop", true); }
function onActorDragLeave(event) { ui.actorDropElt.querySelector(".drop-asset-text").classList.toggle("can-drop", false); }
function onActorDrop(event) {
    if (network_1.data == null || network_1.data.projectClient.entries == null)
        return;
    // TODO: Support importing multiple assets at once
    const entryId = event.dataTransfer.getData("application/vnd.superpowers.entry").split(",")[0];
    if (typeof entryId !== "string")
        return;
    const entry = network_1.data.projectClient.entries.byId[entryId];
    const plugin = SupClient.getPlugins("importIntoScene")[entry.type];
    if (plugin == null || plugin.content.importActor == null) {
        const reason = SupClient.i18n.t("sceneEditor:errors.cantImportAssetTypeIntoScene");
        new SupClient.Dialogs.InfoDialog(SupClient.i18n.t("sceneEditor:failures.importIntoScene", { reason }));
        return;
    }
    event.preventDefault();
    const raycaster = new THREE.Raycaster();
    const mousePosition = { x: (event.clientX / ui.canvasElt.clientWidth) * 2 - 1, y: -(event.clientY / ui.canvasElt.clientHeight) * 2 + 1 };
    raycaster.setFromCamera(mousePosition, engine_1.default.cameraComponent.threeCamera);
    const plane = new THREE.Plane();
    const offset = new THREE.Vector3(0, 0, -10).applyQuaternion(engine_1.default.cameraActor.getGlobalOrientation(new THREE.Quaternion()));
    const planePosition = engine_1.default.cameraActor.getGlobalPosition(new THREE.Vector3()).add(offset);
    plane.setFromNormalAndCoplanarPoint(offset.normalize(), planePosition);
    const position = raycaster.ray.intersectPlane(plane);
    const options = { transform: { position }, prefab: false };
    plugin.content.importActor(entry, network_1.data.projectClient, options, (err, nodeId) => {
        if (err != null) {
            new SupClient.Dialogs.InfoDialog(SupClient.i18n.t("sceneEditor:failures.importIntoScene", { reason: err }));
            return;
        }
        ui.nodesTreeView.clearSelection();
        const entryElt = ui.nodesTreeView.treeRoot.querySelector(`li[data-id='${nodeId}']`);
        ui.nodesTreeView.addToSelection(entryElt);
        ui.nodesTreeView.scrollIntoView(entryElt);
        setupSelectedNode();
        ui.canvasElt.focus();
    });
}
function onComponentDragEnter(event) { ui.componentDropElt.querySelector(".drop-asset-text").classList.toggle("can-drop", true); }
function onComponentDragLeave(event) { ui.componentDropElt.querySelector(".drop-asset-text").classList.toggle("can-drop", false); }
function onComponentDrop(event) {
    if (network_1.data == null || network_1.data.projectClient.entries == null)
        return;
    // TODO: Support importing multiple assets at once
    const entryId = event.dataTransfer.getData("application/vnd.superpowers.entry").split(",")[0];
    if (typeof entryId !== "string")
        return;
    const entry = network_1.data.projectClient.entries.byId[entryId];
    const plugin = SupClient.getPlugins("importIntoScene")[entry.type];
    if (plugin == null || plugin.content.importComponent == null) {
        const reason = SupClient.i18n.t("sceneEditor:errors.cantImportAssetTypeIntoScene");
        new SupClient.Dialogs.InfoDialog(SupClient.i18n.t("sceneEditor:failures.importIntoScene", { reason }));
        return;
    }
    event.preventDefault();
    const nodeId = ui.nodesTreeView.selectedNodes[0].dataset["id"];
    plugin.content.importComponent(entry, network_1.data.projectClient, nodeId, (err, nodeId) => { });
}
