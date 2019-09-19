"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tmpVector3 = new SupEngine.THREE.Vector3();
const tmpQuaternion = new SupEngine.THREE.Quaternion();
class SceneUpdater {
    constructor(client, engine, config, externalSubscriber) {
        this.client = client;
        this.externalSubscriber = externalSubscriber;
        this.bySceneNodeId = {};
        this.onSceneAssetReceived = (assetId, asset) => {
            this.sceneAsset = asset;
            const walk = (node) => {
                this.createNodeActor(node);
                if (node.children != null && node.children.length > 0) {
                    for (const child of node.children)
                        walk(child);
                }
            };
            for (const node of asset.nodes.pub)
                walk(node);
            if (this.externalSubscriber.onAssetReceived != null)
                this.externalSubscriber.onAssetReceived(assetId, asset);
        };
        this.onSceneAssetEdited = (assetId, command, ...args) => {
            const commandFunction = this.onEditCommands[command];
            if (commandFunction != null)
                commandFunction.apply(this, args);
            if (this.externalSubscriber.onAssetEdited != null)
                this.externalSubscriber.onAssetEdited(assetId, command, ...args);
        };
        this.onEditCommands = {
            addNode: (node, parentId, index) => {
                this.createNodeActor(node);
            },
            moveNode: (id, parentId, index) => {
                const nodeActor = this.bySceneNodeId[id].actor;
                const parentNodeActor = (this.bySceneNodeId[parentId] != null) ? this.bySceneNodeId[parentId].actor : null;
                nodeActor.setParent(parentNodeActor);
                this.onUpdateMarkerRecursive(id);
            },
            setNodeProperty: (id, path, value) => {
                const nodeEditorData = this.bySceneNodeId[id];
                switch (path) {
                    case "position":
                        nodeEditorData.actor.setLocalPosition(value);
                        if (!this.isInPrefab)
                            this.onUpdateMarkerRecursive(id);
                        break;
                    case "orientation":
                        nodeEditorData.actor.setLocalOrientation(value);
                        if (!this.isInPrefab)
                            this.onUpdateMarkerRecursive(id);
                        break;
                    case "scale":
                        nodeEditorData.actor.setLocalScale(value);
                        if (!this.isInPrefab)
                            this.onUpdateMarkerRecursive(id);
                        break;
                    case "prefab.sceneAssetId":
                        nodeEditorData.prefabUpdater.config_setProperty("sceneAssetId", value);
                        break;
                }
            },
            duplicateNode: (rootNode, newNodes) => {
                for (const newNode of newNodes)
                    this.createNodeActor(newNode.node);
            },
            removeNode: (id) => {
                this.recurseClearActor(id);
            },
            addComponent(nodeComponent, nodeId, index) {
                this.createNodeActorComponent(this.sceneAsset.nodes.byId[nodeId], nodeComponent, this.bySceneNodeId[nodeId].actor);
            },
            editComponent(nodeId, componentId, command, ...args) {
                const componentUpdater = this.bySceneNodeId[nodeId].bySceneComponentId[componentId].componentUpdater;
                if (componentUpdater[`config_${command}`] != null)
                    componentUpdater[`config_${command}`].apply(componentUpdater, args);
            },
            removeComponent(nodeId, componentId) {
                this.gameInstance.destroyComponent(this.bySceneNodeId[nodeId].bySceneComponentId[componentId].component);
                this.bySceneNodeId[nodeId].bySceneComponentId[componentId].componentUpdater.destroy();
                delete this.bySceneNodeId[nodeId].bySceneComponentId[componentId];
            }
        };
        this.onSceneAssetTrashed = (assetId) => {
            this.clearScene();
            if (this.sceneSubscriber.onAssetTrashed != null)
                this.sceneSubscriber.onAssetTrashed(assetId);
        };
        this.gameInstance = engine.gameInstance;
        this.rootActor = engine.actor;
        this.sceneAssetId = config.sceneAssetId;
        this.isInPrefab = config.isInPrefab;
        if (this.externalSubscriber == null)
            this.externalSubscriber = {};
        this.sceneSubscriber = {
            onAssetReceived: this.onSceneAssetReceived,
            onAssetEdited: this.onSceneAssetEdited,
            onAssetTrashed: this.onSceneAssetTrashed
        };
        if (this.sceneAssetId != null)
            this.client.subAsset(this.sceneAssetId, "scene", this.sceneSubscriber);
    }
    destroy() {
        this.clearScene();
        if (this.sceneAssetId != null)
            this.client.unsubAsset(this.sceneAssetId, this.sceneSubscriber);
    }
    onUpdateMarkerRecursive(nodeId) {
        this.sceneAsset.nodes.walkNode(this.sceneAsset.nodes.byId[nodeId], null, (descendantNode) => {
            const nodeEditorData = this.bySceneNodeId[descendantNode.id];
            nodeEditorData.markerActor.setGlobalPosition(nodeEditorData.actor.getGlobalPosition(tmpVector3));
            nodeEditorData.markerActor.setGlobalOrientation(nodeEditorData.actor.getGlobalOrientation(tmpQuaternion));
        });
    }
    recurseClearActor(nodeId) {
        const nodeEditorData = this.bySceneNodeId[nodeId];
        if (nodeEditorData.prefabUpdater == null) {
            for (const childActor of nodeEditorData.actor.children) {
                const sceneNodeId = childActor.sceneNodeId;
                if (sceneNodeId != null)
                    this.recurseClearActor(sceneNodeId);
            }
        }
        else {
            nodeEditorData.prefabUpdater.destroy();
        }
        for (const componentId in nodeEditorData.bySceneComponentId) {
            nodeEditorData.bySceneComponentId[componentId].componentUpdater.destroy();
        }
        if (!this.isInPrefab)
            this.gameInstance.destroyActor(nodeEditorData.markerActor);
        this.gameInstance.destroyActor(nodeEditorData.actor);
        delete this.bySceneNodeId[nodeId];
    }
    config_setProperty(path, value) {
        switch (path) {
            case "sceneAssetId":
                if (this.sceneAssetId != null)
                    this.client.unsubAsset(this.sceneAssetId, this.sceneSubscriber);
                this.sceneAssetId = value;
                this.clearScene();
                this.sceneAsset = null;
                if (this.sceneAssetId != null)
                    this.client.subAsset(this.sceneAssetId, "scene", this.sceneSubscriber);
                break;
        }
    }
    createNodeActor(node) {
        const parentNode = this.sceneAsset.nodes.parentNodesById[node.id];
        let parentActor;
        if (parentNode != null)
            parentActor = this.bySceneNodeId[parentNode.id].actor;
        else
            parentActor = this.rootActor;
        const nodeActor = new SupEngine.Actor(this.gameInstance, node.name, parentActor);
        const nodeId = (this.rootActor == null) ? node.id : this.rootActor.threeObject.userData.nodeId;
        nodeActor.threeObject.userData.nodeId = nodeId;
        nodeActor.threeObject.position.copy(node.position);
        nodeActor.threeObject.quaternion.copy(node.orientation);
        nodeActor.threeObject.scale.copy(node.scale);
        nodeActor.threeObject.updateMatrixWorld(false);
        nodeActor.sceneNodeId = node.id;
        let markerActor;
        if (!this.isInPrefab) {
            markerActor = new SupEngine.Actor(this.gameInstance, `${nodeId} Marker`, null, { layer: -1 });
            markerActor.setGlobalPosition(nodeActor.getGlobalPosition(tmpVector3));
            markerActor.setGlobalOrientation(nodeActor.getGlobalOrientation(tmpQuaternion));
            new SupEngine.editorComponentClasses["TransformMarker"](markerActor);
        }
        this.bySceneNodeId[node.id] = { actor: nodeActor, markerActor, bySceneComponentId: {}, prefabUpdater: null };
        if (node.prefab != null) {
            this.bySceneNodeId[node.id].prefabUpdater = new SceneUpdater(this.client, { gameInstance: this.gameInstance, actor: nodeActor }, { sceneAssetId: node.prefab.sceneAssetId, isInPrefab: true });
        }
        if (node.components != null)
            for (const component of node.components)
                this.createNodeActorComponent(node, component, nodeActor);
        return nodeActor;
    }
    createNodeActorComponent(sceneNode, sceneComponent, nodeActor) {
        let componentClass = SupEngine.editorComponentClasses[`${sceneComponent.type}Marker`];
        if (componentClass == null)
            componentClass = SupEngine.componentClasses[sceneComponent.type];
        const actorComponent = new componentClass(nodeActor);
        this.bySceneNodeId[sceneNode.id].bySceneComponentId[sceneComponent.id] = {
            component: actorComponent,
            componentUpdater: new componentClass.Updater(this.client, actorComponent, sceneComponent.config),
        };
    }
    clearScene() {
        for (const sceneNodeId in this.bySceneNodeId) {
            const sceneNode = this.bySceneNodeId[sceneNodeId];
            if (!this.isInPrefab)
                this.gameInstance.destroyActor(sceneNode.markerActor);
            for (const componentId in sceneNode.bySceneComponentId)
                sceneNode.bySceneComponentId[componentId].componentUpdater.destroy();
            this.gameInstance.destroyActor(sceneNode.actor);
        }
        this.bySceneNodeId = {};
    }
}
exports.default = SceneUpdater;
