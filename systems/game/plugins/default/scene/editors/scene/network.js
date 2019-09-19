"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ui_1 = require("./ui");
const engine_1 = require("./engine");
const async = require("async");
const THREE = SupEngine.THREE;
const SceneUpdater_1 = require("../../components/SceneUpdater");
exports.socket = SupClient.connect(SupClient.query.project);
exports.socket.on("welcome", onWelcome);
exports.socket.on("disconnect", SupClient.onDisconnected);
let sceneSettingSubscriber;
let gameSettingSubscriber;
// TODO
const onEditCommands = {};
function onWelcome() {
    exports.data = { projectClient: new SupClient.ProjectClient(exports.socket, { subEntries: true }) };
    loadPlugins((err) => {
        exports.data.projectClient.subResource("sceneSettings", sceneSettingSubscriber);
        exports.data.projectClient.subResource("gameSettings", gameSettingSubscriber);
        const subscriber = {
            onAssetReceived: onSceneAssetReceived,
            onAssetEdited: (assetId, command, ...args) => { if (onEditCommands[command] != null)
                onEditCommands[command](...args); },
            onAssetTrashed: SupClient.onAssetTrashed
        };
        exports.data.sceneUpdater = new SceneUpdater_1.default(exports.data.projectClient, { gameInstance: engine_1.default.gameInstance, actor: null }, { sceneAssetId: SupClient.query.asset, isInPrefab: false }, subscriber);
    });
}
function loadPlugins(callback) {
    const i18nFiles = [];
    i18nFiles.push({ root: `${window.location.pathname}/../..`, name: "sceneEditor" });
    SupClient.fetch(`/systems/${SupCore.system.id}/plugins.json`, "json", (err, pluginsInfo) => {
        for (const pluginName of pluginsInfo.list) {
            const root = `/systems/${SupCore.system.id}/plugins/${pluginName}`;
            i18nFiles.push({ root, name: "componentEditors" });
        }
        async.parallel([
            (cb) => {
                SupClient.i18n.load(i18nFiles, cb);
            }, (cb) => {
                async.each(pluginsInfo.list, (pluginName, cb) => {
                    const pluginPath = `/systems/${SupCore.system.id}/plugins/${pluginName}`;
                    async.each(["data", "components", "componentConfigs", "componentEditors"], (name, cb) => {
                        SupClient.loadScript(`${pluginPath}/bundles/${name}.js`, cb);
                    }, cb);
                }, cb);
            }
        ], callback);
    });
}
function startIfReady() {
    if (exports.data.sceneUpdater != null && exports.data.sceneUpdater.sceneAsset != null &&
        exports.data.sceneSettingsResource != null && exports.data.gameSettingsResource != null) {
        engine_1.start();
        ui_1.start();
        ui_1.setCameraMode(exports.data.sceneSettingsResource.pub.defaultCameraMode);
        ui_1.setCameraVerticalAxis(exports.data.sceneSettingsResource.pub.defaultVerticalAxis);
        ui_1.setupInspectorLayers();
    }
}
sceneSettingSubscriber = {
    onResourceReceived: (resourceId, resource) => {
        exports.data.sceneSettingsResource = resource;
        startIfReady();
    },
    onResourceEdited: (resourceId, command, propertyName) => { }
};
gameSettingSubscriber = {
    onResourceReceived: (resourceId, resource) => {
        exports.data.gameSettingsResource = resource;
        startIfReady();
    },
    onResourceEdited: (resourceId, command, propertyName) => {
        if (propertyName === "customLayers")
            ui_1.setupInspectorLayers();
    }
};
function onSceneAssetReceived( /*err: string, asset: SceneAsset*/) {
    // Clear tree view
    ui_1.default.nodesTreeView.clearSelection();
    ui_1.default.nodesTreeView.treeRoot.innerHTML = "";
    const box = {
        x: { min: Infinity, max: -Infinity },
        y: { min: Infinity, max: -Infinity },
        z: { min: Infinity, max: -Infinity },
    };
    const pos = new THREE.Vector3();
    function walk(node, parentNode, parentElt) {
        const liElt = ui_1.createNodeElement(node);
        ui_1.default.nodesTreeView.append(liElt, "group", parentElt);
        if (node.children != null && node.children.length > 0) {
            liElt.classList.add("collapsed");
            for (const child of node.children)
                walk(child, node, liElt);
        }
        // Compute scene bounding box
        exports.data.sceneUpdater.bySceneNodeId[node.id].actor.getGlobalPosition(pos);
        box.x.min = Math.min(box.x.min, pos.x);
        box.x.max = Math.max(box.x.max, pos.x);
        box.y.min = Math.min(box.y.min, pos.y);
        box.y.max = Math.max(box.y.max, pos.y);
        box.z.min = Math.min(box.z.min, pos.z);
        box.z.max = Math.max(box.z.max, pos.z);
    }
    for (const node of exports.data.sceneUpdater.sceneAsset.nodes.pub)
        walk(node, null, null);
    // Place camera so that it fits the scene
    if (exports.data.sceneUpdater.sceneAsset.nodes.pub.length > 0) {
        const z = box.z.max + 10;
        engine_1.default.cameraActor.setLocalPosition(new THREE.Vector3((box.x.min + box.x.max) / 2, (box.y.min + box.y.max) / 2, z));
        ui_1.default.camera2DZ.value = z.toString();
    }
    startIfReady();
}
const addNode = onEditCommands["addNode"] = (node, parentId, index) => {
    const nodeElt = ui_1.createNodeElement(node);
    let parentElt;
    if (parentId != null)
        parentElt = ui_1.default.nodesTreeView.treeRoot.querySelector(`[data-id='${parentId}']`);
    ui_1.default.nodesTreeView.insertAt(nodeElt, "group", index, parentElt);
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
        const node = exports.data.sceneUpdater.sceneAsset.nodes.byId[id];
        ui_1.setInspectorPosition(node.position);
        ui_1.setInspectorOrientation(node.orientation);
        ui_1.setInspectorScale(node.scale);
    }
    // TODO: Only refresh if selection is affected
    engine_1.setupHelpers();
};
onEditCommands["setNodeProperty"] = (id, path, value) => {
    const nodeElt = ui_1.default.nodesTreeView.treeRoot.querySelector(`[data-id='${id}']`);
    const isInspected = ui_1.default.nodesTreeView.selectedNodes.length === 1 && nodeElt === ui_1.default.nodesTreeView.selectedNodes[0];
    const node = exports.data.sceneUpdater.sceneAsset.nodes.byId[id];
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
        case "scale":
            if (isInspected)
                ui_1.setInspectorScale(node.scale);
            break;
        case "visible":
            if (isInspected)
                ui_1.setInspectorVisible(value);
            break;
        case "layer":
            if (isInspected)
                ui_1.setInspectorLayer(value);
            break;
        case "prefab.sceneAssetId":
            if (isInspected)
                ui_1.setInspectorPrefabScene(value);
            break;
    }
    // TODO: Only refresh if selection is affected
    engine_1.setupHelpers();
};
onEditCommands["duplicateNode"] = (rootNode, newNodes) => {
    for (const newNode of newNodes)
        addNode(newNode.node, newNode.parentId, newNode.index);
    // TODO: Only refresh if selection is affected
    engine_1.setupHelpers();
};
onEditCommands["removeNode"] = (id) => {
    const nodeElt = ui_1.default.nodesTreeView.treeRoot.querySelector(`[data-id='${id}']`);
    const isInspected = ui_1.default.nodesTreeView.selectedNodes.length === 1 && nodeElt === ui_1.default.nodesTreeView.selectedNodes[0];
    ui_1.default.nodesTreeView.remove(nodeElt);
    if (isInspected)
        ui_1.setupSelectedNode();
    // TODO: Only refresh if selection is affected
    else
        engine_1.setupHelpers();
};
onEditCommands["addComponent"] = (nodeComponent, nodeId, index) => {
    const isInspected = ui_1.default.nodesTreeView.selectedNodes.length === 1 && nodeId === ui_1.default.nodesTreeView.selectedNodes[0].dataset["id"];
    if (isInspected) {
        const componentElt = ui_1.createComponentElement(nodeId, nodeComponent);
        // TODO: Take index into account
        ui_1.default.inspectorElt.querySelector(".components").appendChild(componentElt);
    }
    // TODO: Only refresh if selection is affected
    engine_1.setupHelpers();
};
onEditCommands["editComponent"] = (nodeId, componentId, command, ...args) => {
    const isInspected = ui_1.default.nodesTreeView.selectedNodes.length === 1 && nodeId === ui_1.default.nodesTreeView.selectedNodes[0].dataset["id"];
    if (isInspected) {
        const componentEditor = ui_1.default.componentEditors[componentId];
        const commandFunction = componentEditor[`config_${command}`];
        if (commandFunction != null)
            commandFunction.apply(componentEditor, args);
    }
    // TODO: Only refresh if selection is affected
    engine_1.setupHelpers();
};
onEditCommands["removeComponent"] = (nodeId, componentId) => {
    const isInspected = ui_1.default.nodesTreeView.selectedNodes.length === 1 && nodeId === ui_1.default.nodesTreeView.selectedNodes[0].dataset["id"];
    if (isInspected) {
        ui_1.default.componentEditors[componentId].destroy();
        delete ui_1.default.componentEditors[componentId];
        const componentElt = ui_1.default.inspectorElt.querySelector(`.components > div[data-component-id='${componentId}']`);
        componentElt.parentElement.removeChild(componentElt);
    }
    // TODO: Only refresh if selection is affected
    engine_1.setupHelpers();
};
