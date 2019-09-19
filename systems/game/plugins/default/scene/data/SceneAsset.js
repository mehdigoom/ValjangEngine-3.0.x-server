"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const serverRequire = require;
let THREE;
// NOTE: It is important that we require THREE through SupEngine
// so that we inherit any settings, like the global Euler order
// (or, alternatively, we could duplicate those settings...)
if (global.window == null) {
    THREE = serverRequire("../../../../SupEngine").THREE;
    serverRequire("../componentConfigs/BaseComponentConfig.js");
    SupCore.system.requireForAllPlugins("componentConfigs/index.js");
}
else if (window.SupEngine != null)
    THREE = SupEngine.THREE;
const path = require("path");
const fs = require("fs");
const _ = require("lodash");
const SceneNodes_1 = require("./SceneNodes");
class SceneAsset extends SupCore.Data.Base.Asset {
    constructor(id, pub, server) {
        super(id, pub, SceneAsset.schema, server);
    }
    init(options, callback) {
        this.pub = {
            formatVersion: SceneAsset.currentFormatVersion,
            nodes: []
        };
        super.init(options, callback);
    }
    load(assetPath) {
        fs.readFile(path.join(assetPath, "scene.json"), { encoding: "utf8" }, (err, json) => {
            if (err != null && err.code === "ENOENT") {
                fs.readFile(path.join(assetPath, "asset.json"), { encoding: "utf8" }, (err, json) => {
                    fs.rename(path.join(assetPath, "asset.json"), path.join(assetPath, "scene.json"), (err) => {
                        this._onLoaded(assetPath, JSON.parse(json));
                    });
                });
            }
            else {
                this._onLoaded(assetPath, JSON.parse(json));
            }
        });
    }
    migrate(assetPath, pub, callback) {
        // Migrate component configs
        let hasMigratedComponents = false;
        const componentClasses = this.server.system.getPlugins("componentConfigs");
        const walk = (node) => {
            for (const component of node.components) {
                const componentClass = componentClasses[component.type];
                if (componentClass.migrate != null && componentClass.migrate(component.config))
                    hasMigratedComponents = true;
            }
            for (const child of node.children)
                walk(child);
        };
        for (const node of pub.nodes)
            walk(node);
        if (pub.formatVersion === SceneAsset.currentFormatVersion) {
            callback(hasMigratedComponents);
            return;
        }
        // node.prefabId used to be set to the empty string
        // when the node was a prefab but had no scene associated.
        // It was replaced with node.prefab.sceneAssetId
        // in Superpowers v0.16.
        function migrateOldPrefab(node) {
            const oldPrefabId = node.prefabId;
            if (oldPrefabId != null) {
                delete node.prefabId;
                node.prefab = { sceneAssetId: oldPrefabId.length > 0 ? oldPrefabId : null };
            }
            else {
                for (const child of node.children)
                    migrateOldPrefab(child);
            }
        }
        if (pub.formatVersion == null) {
            for (const rootNode of pub.nodes)
                migrateOldPrefab(rootNode);
            pub.formatVersion = 1;
        }
        callback(true);
    }
    save(outputPath, callback) {
        this.write(fs.writeFile, outputPath, callback);
    }
    clientExport(outputPath, callback) {
        this.write(SupApp.writeFile, outputPath, callback);
    }
    write(writeFile, outputPath, callback) {
        const json = JSON.stringify(this.pub, null, 2);
        writeFile(path.join(outputPath, "scene.json"), json, { encoding: "utf8" }, callback);
    }
    setup() {
        this.componentPathsByDependentAssetId = {};
        this.nodes = new SceneNodes_1.default(this.pub.nodes, this);
        this.nodes.on("addDependencies", (depIds, componentPath) => { this._onAddComponentDependencies(componentPath, depIds); });
        this.nodes.on("removeDependencies", (depIds, componentPath) => { this._onRemoveComponentDependencies(componentPath, depIds); });
        this.nodes.walk((node) => {
            if (node.prefab != null && node.prefab.sceneAssetId != null)
                this._onAddComponentDependencies(`${node.id}_${node.prefab.sceneAssetId}`, [node.prefab.sceneAssetId]);
        });
        for (const nodeId in this.nodes.componentsByNodeId) {
            const components = this.nodes.componentsByNodeId[nodeId];
            for (const componentId in components.configsById) {
                const config = components.configsById[componentId];
                const componentPath = `${nodeId}_${componentId}`;
                ((config, componentPath) => {
                    config.on("addDependencies", (depIds) => { this._onAddComponentDependencies(componentPath, depIds); });
                    config.on("removeDependencies", (depIds) => { this._onRemoveComponentDependencies(componentPath, depIds); });
                })(config, componentPath);
                config.restore();
            }
        }
    }
    /* NOTE: We're restore()'ing all the components during this.setup() since we need
     to rebuild this.componentPathsByDependentAssetId every time the scene asset
     is loaded.
  
     It's a bit weird but it all works out since this.setup() is called right before
     this.restore() anyway.*/
    restore() {
        this.emit("addDependencies", Object.keys(this.componentPathsByDependentAssetId));
    }
    server_addNode(client, name, options, callback) {
        if (name.indexOf("/") !== -1) {
            callback("Actor name cannot contain slashes");
            return;
        }
        const parentId = (options != null) ? options.parentId : null;
        const parentNode = this.nodes.byId[parentId];
        if (parentNode != null && parentNode.prefab != null) {
            callback("Can't create children node on prefabs");
            return;
        }
        if (this.nodes.pub.length !== 0 && parentNode == null) {
            const entry = this.server.data.entries.byId[this.id];
            if (entry.dependentAssetIds.length > 0) {
                callback("A prefab can only have one root actor");
                return;
            }
        }
        const sceneNode = {
            id: null, name: name, children: [], components: [],
            position: (options != null && options.transform != null && options.transform.position != null) ? options.transform.position : { x: 0, y: 0, z: 0 },
            orientation: (options != null && options.transform != null && options.transform.orientation != null) ? options.transform.orientation : { x: 0, y: 0, z: 0, w: 1 },
            scale: (options != null && options.transform != null && options.transform.scale != null) ? options.transform.scale : { x: 1, y: 1, z: 1 },
            visible: true, layer: 0, prefab: (options.prefab) ? { sceneAssetId: null } : null
        };
        const index = (options != null) ? options.index : null;
        this.nodes.add(sceneNode, parentId, index, (err, actualIndex) => {
            if (err != null) {
                callback(err);
                return;
            }
            callback(null, sceneNode.id, sceneNode, parentId, actualIndex);
            this.emit("change");
        });
    }
    client_addNode(node, parentId, index) {
        this.nodes.client_add(node, parentId, index);
    }
    server_setNodeProperty(client, id, path, value, callback) {
        if (path === "name" && value.indexOf("/") !== -1) {
            callback("Actor name cannot contain slashes");
            return;
        }
        this.nodes.setProperty(id, path, value, (err, actualValue) => {
            if (err != null) {
                callback(err);
                return;
            }
            callback(null, null, id, path, actualValue);
            this.emit("change");
        });
    }
    client_setNodeProperty(id, path, value) {
        this.nodes.client_setProperty(id, path, value);
    }
    server_moveNode(client, id, parentId, index, callback) {
        const node = this.nodes.byId[id];
        if (node == null) {
            callback(`Invalid node id: ${id}`);
            return;
        }
        const parentNode = this.nodes.byId[parentId];
        if (parentNode != null && parentNode.prefab != null) {
            callback("Can't move children node on prefabs");
            return;
        }
        if (parentNode == null) {
            const entry = this.server.data.entries.byId[this.id];
            if (entry.dependentAssetIds.length > 0) {
                callback("A prefab can only have one root actor");
                return;
            }
        }
        const globalMatrix = this.computeGlobalMatrix(node);
        this.nodes.move(id, parentId, index, (err, actualIndex) => {
            if (err != null) {
                callback(err);
                return;
            }
            this.applyGlobalMatrix(node, globalMatrix);
            callback(null, null, id, parentId, actualIndex);
            this.emit("change");
        });
    }
    computeGlobalMatrix(node) {
        const matrix = new THREE.Matrix4().compose(node.position, node.orientation, node.scale);
        const parentNode = this.nodes.parentNodesById[node.id];
        if (parentNode != null) {
            const parentGlobalMatrix = this.computeGlobalMatrix(parentNode);
            matrix.multiplyMatrices(parentGlobalMatrix, matrix);
        }
        return matrix;
    }
    applyGlobalMatrix(node, matrix) {
        const parentNode = this.nodes.parentNodesById[node.id];
        if (parentNode != null) {
            const parentGlobalMatrix = this.computeGlobalMatrix(parentNode);
            matrix.multiplyMatrices(new THREE.Matrix4().getInverse(parentGlobalMatrix), matrix);
        }
        const position = new THREE.Vector3();
        const orientation = new THREE.Quaternion();
        const scale = new THREE.Vector3();
        matrix.decompose(position, orientation, scale);
        node.position = { x: position.x, y: position.y, z: position.z };
        node.orientation = { x: orientation.x, y: orientation.y, z: orientation.z, w: orientation.w };
        node.scale = { x: scale.x, y: scale.y, z: scale.z };
    }
    client_moveNode(id, parentId, index) {
        const node = this.nodes.byId[id];
        const globalMatrix = this.computeGlobalMatrix(node);
        this.nodes.client_move(id, parentId, index);
        this.applyGlobalMatrix(node, globalMatrix);
    }
    server_duplicateNode(client, newName, id, index, callback) {
        if (newName.indexOf("/") !== -1) {
            callback("Actor name cannot contain slashes");
            return;
        }
        const referenceNode = this.nodes.byId[id];
        if (referenceNode == null) {
            callback(`Invalid node id: ${id}`);
            return;
        }
        const parentNode = this.nodes.parentNodesById[id];
        if (parentNode == null) {
            const entry = this.server.data.entries.byId[this.id];
            if (entry.dependentAssetIds.length > 0) {
                callback("A prefab can only have one root actor");
                return;
            }
        }
        const newNodes = [];
        let totalNodeCount = 0;
        const walk = (node) => {
            totalNodeCount += 1;
            for (const childNode of node.children)
                walk(childNode);
        };
        walk(referenceNode);
        const rootNode = {
            id: null, name: newName, children: [],
            components: _.cloneDeep(referenceNode.components),
            position: _.cloneDeep(referenceNode.position),
            orientation: _.cloneDeep(referenceNode.orientation),
            scale: _.cloneDeep(referenceNode.scale),
            visible: referenceNode.visible, layer: referenceNode.layer, prefab: _.cloneDeep(referenceNode.prefab)
        };
        const parentId = (parentNode != null) ? parentNode.id : null;
        const addNode = (newNode, parentId, index, children) => {
            this.nodes.add(newNode, parentId, index, (err, actualIndex) => {
                if (err != null) {
                    callback(err);
                    return;
                }
                for (const componentId in this.nodes.componentsByNodeId[newNode.id].configsById) {
                    const config = this.nodes.componentsByNodeId[newNode.id].configsById[componentId];
                    const componentPath = `${newNode.id}_${componentId}`;
                    ((config, componentPath) => {
                        config.on("addDependencies", (depIds) => { this._onAddComponentDependencies(componentPath, depIds); });
                        config.on("removeDependencies", (depIds) => { this._onRemoveComponentDependencies(componentPath, depIds); });
                    })(config, componentPath);
                    config.restore();
                }
                newNodes.push({ node: newNode, parentId, index: actualIndex });
                if (newNodes.length === totalNodeCount) {
                    callback(null, rootNode.id, rootNode, newNodes);
                    this.emit("change");
                }
                for (let childIndex = 0; childIndex < children.length; childIndex++) {
                    const childNode = children[childIndex];
                    const node = {
                        id: null, name: childNode.name, children: [],
                        components: _.cloneDeep(childNode.components),
                        position: _.cloneDeep(childNode.position),
                        orientation: _.cloneDeep(childNode.orientation),
                        scale: _.cloneDeep(childNode.scale),
                        visible: childNode.visible, layer: childNode.layer, prefab: _.cloneDeep(childNode.prefab)
                    };
                    addNode(node, newNode.id, childIndex, childNode.children);
                }
            });
        };
        addNode(rootNode, parentId, index, referenceNode.children);
    }
    client_duplicateNode(rootNode, newNodes) {
        for (const newNode of newNodes) {
            newNode.node.children.length = 0;
            this.nodes.client_add(newNode.node, newNode.parentId, newNode.index);
        }
    }
    server_removeNode(client, id, callback) {
        this.nodes.remove(id, (err) => {
            if (err != null) {
                callback(err);
                return;
            }
            callback(null, null, id);
            this.emit("change");
        });
    }
    client_removeNode(id) {
        this.nodes.client_remove(id);
    }
    // Components
    _onAddComponentDependencies(componentPath, depIds) {
        // console.log `Adding component dependencies: ${componentPath} - ${depIds}`
        const addedDepIds = [];
        for (const depId of depIds) {
            if (this.componentPathsByDependentAssetId[depId] == null)
                this.componentPathsByDependentAssetId[depId] = [];
            const componentPaths = this.componentPathsByDependentAssetId[depId];
            if (componentPaths.indexOf(componentPath) === -1) {
                componentPaths.push(componentPath);
                if (componentPaths.length === 1)
                    addedDepIds.push(depId);
            }
        }
        if (addedDepIds.length > 0)
            this.emit("addDependencies", addedDepIds);
    }
    _onRemoveComponentDependencies(componentPath, depIds) {
        // console.log `Removing component dependencies: ${componentPath} - ${depIds}`
        const removedDepIds = [];
        for (const depId of depIds) {
            const componentPaths = this.componentPathsByDependentAssetId[depId];
            const index = (componentPaths != null) ? componentPaths.indexOf(componentPath) : null;
            if (index != null && index !== -1) {
                componentPaths.splice(index, 1);
                if (componentPaths.length === 0) {
                    removedDepIds.push(depId);
                    delete this.componentPathsByDependentAssetId[depId];
                }
            }
        }
        if (removedDepIds.length > 0)
            this.emit("removeDependencies", removedDepIds);
    }
    server_addComponent(client, nodeId, componentType, index, callback) {
        const componentConfigClass = this.server.system.getPlugins("componentConfigs")[componentType];
        if (componentConfigClass == null) {
            callback("Invalid component type");
            return;
        }
        const node = this.nodes.byId[nodeId];
        if (node != null && node.prefab != null) {
            callback("Can't add component on prefabs");
            return;
        }
        const component = {
            type: componentType,
            config: componentConfigClass.create(),
        };
        this.nodes.addComponent(nodeId, component, index, (err, actualIndex) => {
            if (err != null) {
                callback(err);
                return;
            }
            const config = this.nodes.componentsByNodeId[nodeId].configsById[component.id];
            const componentPath = `${nodeId}_${component.id}`;
            config.on("addDependencies", (depIds) => { this._onAddComponentDependencies(componentPath, depIds); });
            config.on("removeDependencies", (depIds) => { this._onRemoveComponentDependencies(componentPath, depIds); });
            callback(null, component.id, component, nodeId, actualIndex);
            this.emit("change");
        });
    }
    client_addComponent(component, nodeId, index) {
        this.nodes.client_addComponent(nodeId, component, index);
    }
    server_editComponent(client, nodeId, componentId, command, ...args) {
        const callback = args.pop();
        const components = this.nodes.componentsByNodeId[nodeId];
        if (components == null) {
            callback(`Invalid node id: ${nodeId}`);
            return;
        }
        const componentConfig = components.configsById[componentId];
        if (componentConfig == null) {
            callback(`Invalid component id: ${componentId}`);
            return;
        }
        const commandMethod = componentConfig[`server_${command}`];
        if (commandMethod == null) {
            callback("Invalid component command");
            return;
        }
        commandMethod.call(componentConfig, client, ...args, (err, ...callbackArgs) => {
            if (err != null) {
                callback(err);
                return;
            }
            callback(null, null, nodeId, componentId, command, ...callbackArgs);
            this.emit("change");
        });
    }
    client_editComponent(nodeId, componentId, command, ...args) {
        const componentConfig = this.nodes.componentsByNodeId[nodeId].configsById[componentId];
        const commandMethod = componentConfig[`client_${command}`];
        commandMethod.apply(componentConfig, args);
    }
    server_removeComponent(client, nodeId, componentId, callback) {
        const components = this.nodes.componentsByNodeId[nodeId];
        if (components == null) {
            callback(`Invalid node id: ${nodeId}`);
            return;
        }
        components.remove(componentId, (err) => {
            if (err != null) {
                callback(err);
                return;
            }
            callback(null, null, nodeId, componentId);
            this.emit("change");
        });
    }
    client_removeComponent(nodeId, componentId) {
        this.nodes.componentsByNodeId[nodeId].client_remove(componentId);
    }
}
SceneAsset.currentFormatVersion = 1;
SceneAsset.schema = {
    nodes: { type: "array" },
};
exports.default = SceneAsset;
