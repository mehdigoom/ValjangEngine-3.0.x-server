"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ui_1 = require("./ui");
const textureArea = require("./textureArea");
const engine_1 = require("./engine");
const CubicModelRenderer_1 = require("../../components/CubicModelRenderer");
const CubicModelRendererUpdater_1 = require("../../components/CubicModelRendererUpdater");
SupClient.i18n.load([{ root: `${window.location.pathname}/../..`, name: "cubicModelEditor" }], () => {
    exports.socket = SupClient.connect(SupClient.query.project);
    exports.socket.on("connect", onConnected);
    exports.socket.on("disconnect", SupClient.onDisconnected);
});
const onEditCommands = {};
function onConnected() {
    exports.data = {};
    exports.data.projectClient = new SupClient.ProjectClient(exports.socket);
    const cubicModelActor = new SupEngine.Actor(engine_1.default.gameInstance, "Cubic Model");
    const cubicModelRenderer = new CubicModelRenderer_1.default(cubicModelActor);
    const config = { cubicModelAssetId: SupClient.query.asset /*, materialType: "basic"*/ };
    const receiveCallbacks = { cubicModel: onAssetReceived };
    const editCallbacks = { cubicModel: onEditCommands };
    exports.data.cubicModelUpdater = new CubicModelRendererUpdater_1.default(exports.data.projectClient, cubicModelRenderer, config, receiveCallbacks, editCallbacks);
}
function onAssetReceived() {
    // Clear tree view
    ui_1.default.nodesTreeView.clearSelection();
    ui_1.default.nodesTreeView.treeRoot.innerHTML = "";
    function walk(node, parentNode, parentElt) {
        const liElt = ui_1.createNodeElement(node);
        ui_1.default.nodesTreeView.append(liElt, "group", parentElt);
        if (node.children != null && node.children.length > 0) {
            liElt.classList.add("collapsed");
            for (const child of node.children)
                walk(child, node, liElt);
        }
    }
    for (const node of exports.data.cubicModelUpdater.cubicModelAsset.nodes.pub)
        walk(node, null, null);
    const pub = exports.data.cubicModelUpdater.cubicModelAsset.pub;
    ui_1.default.pixelsPerUnitInput.value = pub.pixelsPerUnit.toString();
    ui_1.default.textureWidthSelect.value = pub.textureWidth.toString();
    ui_1.default.textureHeightSelect.value = pub.textureHeight.toString();
    document.querySelector("button.new-node").disabled = false;
    textureArea.setup();
}
onEditCommands["setProperty"] = (path, value) => {
    if (path === "pixelsPerUnit")
        ui_1.default.pixelsPerUnitInput.value = value.toString();
};
onEditCommands["addNode"] = (node, parentId, index) => {
    const nodeElt = ui_1.createNodeElement(node);
    let parentElt;
    if (parentId != null)
        parentElt = ui_1.default.nodesTreeView.treeRoot.querySelector(`[data-id='${parentId}']`);
    ui_1.default.nodesTreeView.insertAt(nodeElt, "group", index, parentElt);
    textureArea.addNode(node);
};
onEditCommands["moveNode"] = (id, parentId, index) => {
    // Reparent tree node
    const nodeElt = ui_1.default.nodesTreeView.treeRoot.querySelector(`[data-id='${id}']`);
    const isInspected = ui_1.default.nodesTreeView.selectedNodes.length === 1 && nodeElt === ui_1.default.nodesTreeView.selectedNodes[0];
    let parentElt;
    if (parentId != null)
        parentElt = ui_1.default.nodesTreeView.treeRoot.querySelector(`[data-id='${parentId}']`);
    ui_1.default.nodesTreeView.insertAt(nodeElt, "group", index, parentElt);
    // Refresh inspector
    if (isInspected) {
        const node = exports.data.cubicModelUpdater.cubicModelAsset.nodes.byId[id];
        ui_1.setInspectorPosition(node.position);
        ui_1.setInspectorOrientation(node.orientation);
    }
    // TODO: Only refresh if selection is affected
    engine_1.setupHelpers();
};
onEditCommands["moveNodePivot"] = (id, value) => {
    const nodeElt = ui_1.default.nodesTreeView.treeRoot.querySelector(`[data-id='${id}']`);
    const isInspected = ui_1.default.nodesTreeView.selectedNodes.length === 1 && nodeElt === ui_1.default.nodesTreeView.selectedNodes[0];
    const node = exports.data.cubicModelUpdater.cubicModelAsset.nodes.byId[id];
    if (isInspected) {
        ui_1.setInspectorPosition(node.position);
        ui_1.setInspectorOrientation(node.orientation);
        ui_1.setInspectorShapeOffset(node.shape.offset);
    }
    // TODO: Only refresh if selection is affected
    engine_1.setupHelpers();
};
onEditCommands["setNodeProperty"] = (id, path, value) => {
    const nodeElt = ui_1.default.nodesTreeView.treeRoot.querySelector(`[data-id='${id}']`);
    const isInspected = ui_1.default.nodesTreeView.selectedNodes.length === 1 && nodeElt === ui_1.default.nodesTreeView.selectedNodes[0];
    const node = exports.data.cubicModelUpdater.cubicModelAsset.nodes.byId[id];
    switch (path) {
        case "name":
            nodeElt.querySelector(".name").textContent = value;
            break;
        case "position":
            if (isInspected)
                ui_1.setInspectorPosition(node.position);
            break;
        case "orientation":
            if (isInspected)
                ui_1.setInspectorOrientation(node.orientation);
            break;
        case "shape.offset":
            if (isInspected)
                ui_1.setInspectorShapeOffset(node.shape.offset);
            break;
        case "shape.settings.size":
            if (isInspected)
                ui_1.setInspectorBoxSize(node.shape.settings.size);
            break;
        case "shape.settings.stretch":
            if (isInspected)
                ui_1.setInspectorBoxStretch(node.shape.settings.stretch);
            break;
    }
    textureArea.updateNode(node);
    // TODO: Only refresh if selection is affected
    engine_1.setupHelpers();
};
onEditCommands["duplicateNode"] = (rootNode, newNodes) => {
    for (const newNode of newNodes)
        onEditCommands["addNode"](newNode.node, newNode.parentId, newNode.index);
    // TODO: Only refresh if selection is affected
    engine_1.setupHelpers();
};
onEditCommands["removeNode"] = (id) => {
    const nodeElt = ui_1.default.nodesTreeView.treeRoot.querySelector(`[data-id='${id}']`);
    const isInspected = ui_1.default.nodesTreeView.selectedNodes.length === 1 && nodeElt === ui_1.default.nodesTreeView.selectedNodes[0];
    ui_1.default.nodesTreeView.remove(nodeElt);
    textureArea.updateRemovedNode();
    if (isInspected)
        ui_1.setupSelectedNode();
    // TODO: Only refresh if selection is affected
    engine_1.setupHelpers();
};
onEditCommands["moveNodeTextureOffset"] = (nodeIds, offset) => {
    for (const id of nodeIds) {
        const node = exports.data.cubicModelUpdater.cubicModelAsset.nodes.byId[id];
        textureArea.updateNode(node);
    }
};
onEditCommands["changeTextureWidth"] = () => {
    ui_1.default.textureWidthSelect.value = exports.data.cubicModelUpdater.cubicModelAsset.pub.textureWidth.toString();
    textureArea.setupTexture();
};
onEditCommands["changeTextureHeight"] = () => {
    ui_1.default.textureHeightSelect.value = exports.data.cubicModelUpdater.cubicModelAsset.pub.textureHeight.toString();
    textureArea.setupTexture();
};
