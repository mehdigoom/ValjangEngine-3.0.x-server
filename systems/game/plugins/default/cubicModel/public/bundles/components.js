(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const THREE = SupEngine.THREE;
const CubicModelRendererUpdater_1 = require("./CubicModelRendererUpdater");
class CubicModelRenderer extends SupEngine.ActorComponent {
    // castShadow = false;
    // receiveShadow = false;
    constructor(actor) {
        super(actor, "ModelRenderer");
        this.materialType = "basic";
    }
    _clearMesh() {
        this.actor.threeObject.remove(this.threeRoot);
        this.threeRoot.traverse((obj) => { if (obj.dispose != null)
            obj.dispose(); });
        this.threeRoot = null;
        this.byNodeId = null;
    }
    _destroy() {
        if (this.asset != null)
            this._clearMesh();
        this.asset = null;
        super._destroy();
    }
    setCubicModel(asset, materialType, customShader) {
        if (this.asset != null)
            this._clearMesh();
        this.asset = asset;
        if (asset == null)
            return;
        // Nodes
        this.threeRoot = new THREE.Object3D();
        this.threeRoot.scale.set(1 / asset.pixelsPerUnit, 1 / asset.pixelsPerUnit, 1 / asset.pixelsPerUnit);
        this.byNodeId = {};
        const walkNode = (node, parentRendererNode, parentOffset) => {
            const rendererNode = this._makeNode(node, parentRendererNode, parentOffset);
            for (const childNode of node.children)
                walkNode(childNode, rendererNode, node.shape.offset);
        };
        for (const rootNode of asset.nodes)
            walkNode(rootNode, null, { x: 0, y: 0, z: 0 });
        this.actor.threeObject.add(this.threeRoot);
        this.threeRoot.updateMatrixWorld(false);
    }
    _makeNode(node, parentRendererNode, parentOffset) {
        let pivot;
        const material = new THREE.MeshBasicMaterial({
            map: this.asset.textures["map"],
            side: THREE.DoubleSide,
            transparent: true
        });
        pivot = new THREE.Object3D();
        pivot.name = node.name;
        pivot.userData.cubicNodeId = node.id;
        let shape;
        if (node.shape.type === "box") {
            const size = node.shape.settings.size;
            const boxGeometry = new THREE.BoxGeometry(size.x, size.y, size.z);
            this.updateBoxNodeUv(boxGeometry, node);
            shape = new THREE.Mesh(boxGeometry, material);
            shape.scale.set(node.shape.settings.stretch.x, node.shape.settings.stretch.y, node.shape.settings.stretch.z);
        }
        if (shape != null) {
            shape.position.set(node.shape.offset.x, node.shape.offset.y, node.shape.offset.z);
            pivot.add(shape);
        }
        const rendererNode = { pivot, shape, nodeId: node.id, children: [] };
        this.byNodeId[node.id] = rendererNode;
        if (parentRendererNode != null)
            parentRendererNode.children.push(rendererNode);
        pivot.position.set(node.position.x + parentOffset.x, node.position.y + parentOffset.y, node.position.z + parentOffset.z);
        pivot.quaternion.set(node.orientation.x, node.orientation.y, node.orientation.z, node.orientation.w);
        // NOTE: Hierarchical scale is not supported for now, we'll see if the need arises
        // nodeObject.scale.set(node.scale.x, node.scale.y, node.scale.z);
        if (parentRendererNode == null)
            this.threeRoot.add(pivot);
        else
            parentRendererNode.pivot.add(pivot);
        pivot.updateMatrixWorld(false);
        return rendererNode;
    }
    updateBoxNodeUv(geometry, node) {
        const width = this.asset.textureWidth;
        const height = this.asset.textureHeight;
        const size = node.shape.settings.size;
        let offset;
        const bottomLeft = new THREE.Vector2();
        const bottomRight = new THREE.Vector2();
        const topLeft = new THREE.Vector2();
        const topRight = new THREE.Vector2();
        // Left Face
        offset = node.shape.textureLayout["left"].offset;
        bottomLeft.set((offset.x) / width, (height - offset.y - size.y) / height);
        bottomRight.set((offset.x + size.z) / width, (height - offset.y - size.y) / height);
        topLeft.set((offset.x) / width, (height - offset.y) / height);
        topRight.set((offset.x + size.z) / width, (height - offset.y) / height);
        geometry.faceVertexUvs[0][2][0].copy(topLeft);
        geometry.faceVertexUvs[0][2][1].copy(bottomLeft);
        geometry.faceVertexUvs[0][2][2].copy(topRight);
        geometry.faceVertexUvs[0][3][0].copy(bottomLeft);
        geometry.faceVertexUvs[0][3][1].copy(bottomRight);
        geometry.faceVertexUvs[0][3][2].copy(topRight);
        // Front Face
        offset = node.shape.textureLayout["front"].offset;
        bottomLeft.set((offset.x) / width, (height - offset.y - size.y) / height);
        bottomRight.set((offset.x + size.x) / width, (height - offset.y - size.y) / height);
        topLeft.set((offset.x) / width, (height - offset.y) / height);
        topRight.set((offset.x + size.x) / width, (height - offset.y) / height);
        geometry.faceVertexUvs[0][8][0].copy(topLeft);
        geometry.faceVertexUvs[0][8][1].copy(bottomLeft);
        geometry.faceVertexUvs[0][8][2].copy(topRight);
        geometry.faceVertexUvs[0][9][0].copy(bottomLeft);
        geometry.faceVertexUvs[0][9][1].copy(bottomRight);
        geometry.faceVertexUvs[0][9][2].copy(topRight);
        // Right Face
        offset = node.shape.textureLayout["right"].offset;
        bottomLeft.set((offset.x) / width, (height - offset.y - size.y) / height);
        bottomRight.set((offset.x + size.z) / width, (height - offset.y - size.y) / height);
        topLeft.set((offset.x) / width, (height - offset.y) / height);
        topRight.set((offset.x + size.z) / width, (height - offset.y) / height);
        geometry.faceVertexUvs[0][0][0].copy(topLeft);
        geometry.faceVertexUvs[0][0][1].copy(bottomLeft);
        geometry.faceVertexUvs[0][0][2].copy(topRight);
        geometry.faceVertexUvs[0][1][0].copy(bottomLeft);
        geometry.faceVertexUvs[0][1][1].copy(bottomRight);
        geometry.faceVertexUvs[0][1][2].copy(topRight);
        // Back Face
        offset = node.shape.textureLayout["back"].offset;
        bottomLeft.set((offset.x) / width, (height - offset.y - size.y) / height);
        bottomRight.set((offset.x + size.x) / width, (height - offset.y - size.y) / height);
        topLeft.set((offset.x) / width, (height - offset.y) / height);
        topRight.set((offset.x + size.x) / width, (height - offset.y) / height);
        geometry.faceVertexUvs[0][10][0].copy(topLeft);
        geometry.faceVertexUvs[0][10][1].copy(bottomLeft);
        geometry.faceVertexUvs[0][10][2].copy(topRight);
        geometry.faceVertexUvs[0][11][0].copy(bottomLeft);
        geometry.faceVertexUvs[0][11][1].copy(bottomRight);
        geometry.faceVertexUvs[0][11][2].copy(topRight);
        // Top Face
        offset = node.shape.textureLayout["top"].offset;
        bottomLeft.set((offset.x) / width, (height - offset.y - size.z) / height);
        bottomRight.set((offset.x + size.x) / width, (height - offset.y - size.z) / height);
        topLeft.set((offset.x) / width, (height - offset.y) / height);
        topRight.set((offset.x + size.x) / width, (height - offset.y) / height);
        geometry.faceVertexUvs[0][4][0].copy(topLeft);
        geometry.faceVertexUvs[0][4][1].copy(bottomLeft);
        geometry.faceVertexUvs[0][4][2].copy(topRight);
        geometry.faceVertexUvs[0][5][0].copy(bottomLeft);
        geometry.faceVertexUvs[0][5][1].copy(bottomRight);
        geometry.faceVertexUvs[0][5][2].copy(topRight);
        // Bottom Face
        offset = node.shape.textureLayout["bottom"].offset;
        bottomLeft.set((offset.x) / width, (height - offset.y - size.z) / height);
        bottomRight.set((offset.x + size.x) / width, (height - offset.y - size.z) / height);
        topLeft.set((offset.x) / width, (height - offset.y) / height);
        topRight.set((offset.x + size.x) / width, (height - offset.y) / height);
        geometry.faceVertexUvs[0][6][0].copy(topLeft);
        geometry.faceVertexUvs[0][6][1].copy(bottomLeft);
        geometry.faceVertexUvs[0][6][2].copy(topRight);
        geometry.faceVertexUvs[0][7][0].copy(bottomLeft);
        geometry.faceVertexUvs[0][7][1].copy(bottomRight);
        geometry.faceVertexUvs[0][7][2].copy(topRight);
        geometry.uvsNeedUpdate = true;
    }
    setIsLayerActive(active) { if (this.threeRoot != null)
        this.threeRoot.visible = active; }
}
/* tslint:disable:variable-name */
CubicModelRenderer.Updater = CubicModelRendererUpdater_1.default;
exports.default = CubicModelRenderer;

},{"./CubicModelRendererUpdater":2}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const THREE = SupEngine.THREE;
class CubicModelRendererUpdater {
    constructor(client, cubicModelRenderer, config, receiveAssetCallbacks, editAssetCallbacks) {
        this.cubicModelAsset = null;
        this.cubicModelSubscriber = {
            onAssetReceived: this._onCubicModelAssetReceived.bind(this),
            onAssetEdited: this._onCubicModelAssetEdited.bind(this),
            onAssetTrashed: this._onCubicModelAssetTrashed.bind(this)
        };
        this.client = client;
        this.cubicModelRenderer = cubicModelRenderer;
        this.receiveAssetCallbacks = receiveAssetCallbacks;
        this.editAssetCallbacks = editAssetCallbacks;
        this.cubicModelAssetId = config.cubicModelAssetId;
        if (this.cubicModelAssetId != null)
            this.client.subAsset(this.cubicModelAssetId, "cubicModel", this.cubicModelSubscriber);
    }
    destroy() {
        if (this.cubicModelAssetId != null)
            this.client.unsubAsset(this.cubicModelAssetId, this.cubicModelSubscriber);
    }
    _onCubicModelAssetReceived(assetId, asset) {
        this.cubicModelAsset = asset;
        this._setCubicModel();
        if (this.receiveAssetCallbacks != null)
            this.receiveAssetCallbacks.cubicModel();
    }
    _setCubicModel() {
        if (this.cubicModelAsset == null) {
            this.cubicModelRenderer.setCubicModel(null);
            return;
        }
        this.cubicModelRenderer.setCubicModel(this.cubicModelAsset.pub);
    }
    _onCubicModelAssetEdited(id, command, ...args) {
        const commandFunction = this[`_onEditCommand_${command}`];
        if (commandFunction != null)
            commandFunction.apply(this, args);
        if (this.editAssetCallbacks != null) {
            const editCallback = this.editAssetCallbacks.cubicModel[command];
            if (editCallback != null)
                editCallback.apply(null, args);
        }
    }
    _onEditCommand_setProperty(path, value) {
        switch (path) {
            case "pixelsPerUnit":
                const scale = 1 / value;
                this.cubicModelRenderer.threeRoot.scale.set(scale, scale, scale);
                this.cubicModelRenderer.threeRoot.updateMatrixWorld(false);
                break;
        }
    }
    _onEditCommand_addNode(node, parentId, index) {
        this._createRendererNode(node);
    }
    _createRendererNode(node) {
        const parentNode = this.cubicModelAsset.nodes.parentNodesById[node.id];
        const parentRendererNode = (parentNode != null) ? this.cubicModelRenderer.byNodeId[parentNode.id] : null;
        const offset = (parentNode != null) ? parentNode.shape.offset : { x: 0, y: 0, z: 0 };
        this.cubicModelRenderer._makeNode(node, parentRendererNode, offset);
    }
    _onEditCommand_moveNode(id, parentId, index) {
        const rendererNode = this.cubicModelRenderer.byNodeId[id];
        const pivot = rendererNode.pivot;
        const matrix = pivot.matrixWorld.clone();
        const previousParentId = pivot.parent.userData.cubicNodeId;
        if (previousParentId != null) {
            const parentNode = this.cubicModelRenderer.byNodeId[previousParentId];
            parentNode.children.splice(parentNode.children.indexOf(rendererNode), 1);
        }
        const parent = (parentId != null) ? this.cubicModelRenderer.byNodeId[parentId].pivot : this.cubicModelRenderer.threeRoot;
        parent.add(pivot);
        matrix.multiplyMatrices(new THREE.Matrix4().getInverse(parent.matrixWorld), matrix);
        matrix.decompose(pivot.position, pivot.quaternion, pivot.scale);
        pivot.updateMatrixWorld(false);
    }
    _onEditCommand_moveNodePivot(id, value) {
        const rendererNode = this.cubicModelRenderer.byNodeId[id];
        const node = this.cubicModelAsset.nodes.byId[id];
        const parentNode = this.cubicModelAsset.nodes.parentNodesById[id];
        const parentOffset = (parentNode != null) ? parentNode.shape.offset : { x: 0, y: 0, z: 0 };
        rendererNode.pivot.position.set(value.x + parentOffset.x, value.y + parentOffset.y, value.z + parentOffset.z);
        rendererNode.pivot.quaternion.set(node.orientation.x, node.orientation.y, node.orientation.z, node.orientation.w);
        rendererNode.shape.position.set(node.shape.offset.x, node.shape.offset.y, node.shape.offset.z);
        const walk = (rendererNode, parentOffset) => {
            const node = this.cubicModelAsset.nodes.byId[rendererNode.nodeId];
            rendererNode.pivot.position.set(node.position.x + parentOffset.x, node.position.y + parentOffset.y, node.position.z + parentOffset.z);
            for (const child of rendererNode.children)
                walk(child, node.shape.offset);
        };
        for (const child of rendererNode.children)
            walk(child, node.shape.offset);
        rendererNode.pivot.updateMatrixWorld(false);
    }
    _onEditCommand_setNodeProperty(id, path, value) {
        const rendererNode = this.cubicModelRenderer.byNodeId[id];
        const node = this.cubicModelAsset.nodes.byId[id];
        switch (path) {
            case "name":
                rendererNode.pivot.name = value;
                break;
            case "position":
                const parentNode = this.cubicModelAsset.nodes.parentNodesById[id];
                const parentOffset = (parentNode != null) ? parentNode.shape.offset : { x: 0, y: 0, z: 0 };
                rendererNode.pivot.position.set(value.x + parentOffset.x, value.y + parentOffset.y, value.z + parentOffset.z);
                rendererNode.pivot.updateMatrixWorld(false);
                break;
            case "orientation":
                rendererNode.pivot.quaternion.set(value.x, value.y, value.z, value.w);
                rendererNode.pivot.updateMatrixWorld(false);
                break;
            case "shape.offset":
                rendererNode.shape.position.set(value.x, value.y, value.z);
                const walk = (rendererNode, parentOffset) => {
                    const node = this.cubicModelAsset.nodes.byId[rendererNode.nodeId];
                    rendererNode.pivot.position.set(node.position.x + parentOffset.x, node.position.y + parentOffset.y, node.position.z + parentOffset.z);
                    for (const child of rendererNode.children)
                        walk(child, node.shape.offset);
                };
                for (const child of rendererNode.children)
                    walk(child, node.shape.offset);
                rendererNode.pivot.updateMatrixWorld(false);
                break;
            default: {
                switch (node.shape.type) {
                    case "box":
                        switch (path) {
                            case "shape.settings.size":
                                const geometry = rendererNode.shape.geometry = new THREE.BoxGeometry(value.x, value.y, value.z);
                                this.cubicModelRenderer.updateBoxNodeUv(geometry, node);
                                break;
                            case "shape.settings.stretch":
                                rendererNode.shape.scale.set(value.x, value.y, value.z);
                                rendererNode.shape.updateMatrixWorld(false);
                                break;
                        }
                        break;
                }
                break;
            }
        }
    }
    _onEditCommand_duplicateNode(rootNode, newNodes) {
        for (const newNode of newNodes)
            this._createRendererNode(newNode.node);
    }
    _onEditCommand_removeNode(id) {
        this._recurseClearNode(id);
    }
    _recurseClearNode(nodeId) {
        const rendererNode = this.cubicModelRenderer.byNodeId[nodeId];
        for (const childNode of rendererNode.children)
            this._recurseClearNode(childNode.nodeId);
        const parentPivot = rendererNode.pivot.parent;
        const parentNodeId = parentPivot.userData.cubicNodeId;
        if (parentNodeId != null) {
            const parentRendererNode = this.cubicModelRenderer.byNodeId[parentNodeId];
            parentRendererNode.children.splice(parentRendererNode.children.indexOf(rendererNode), 1);
        }
        rendererNode.shape.parent.remove(rendererNode.shape);
        rendererNode.shape.geometry.dispose();
        rendererNode.shape.material.dispose();
        rendererNode.pivot.parent.remove(rendererNode.pivot);
        delete this.cubicModelRenderer.byNodeId[nodeId];
    }
    _onEditCommand_moveNodeTextureOffset(nodeIds, offset) {
        for (const id of nodeIds) {
            const node = this.cubicModelAsset.nodes.byId[id];
            const geometry = this.cubicModelRenderer.byNodeId[id].shape.geometry;
            this.cubicModelRenderer.updateBoxNodeUv(geometry, node);
        }
    }
    _onEditCommand_changeTextureWidth() { this._onChangeTextureSize(); }
    _onEditCommand_changeTextureHeight() { this._onChangeTextureSize(); }
    _onChangeTextureSize() {
        for (const id in this.cubicModelAsset.nodes.byId) {
            const node = this.cubicModelAsset.nodes.byId[id];
            const shape = this.cubicModelRenderer.byNodeId[id].shape;
            this.cubicModelRenderer.updateBoxNodeUv(shape.geometry, node);
            const material = shape.material;
            material.map = this.cubicModelAsset.pub.textures["map"];
            material.needsUpdate = true;
        }
    }
    _onCubicModelAssetTrashed() {
        this.cubicModelAsset = null;
        this.cubicModelRenderer.setCubicModel(null);
        // FIXME: the updater shouldn't be dealing with SupClient.onAssetTrashed directly
        if (this.editAssetCallbacks != null)
            SupClient.onAssetTrashed();
    }
    config_setProperty(path, value) {
        switch (path) {
            case "cubicModelAssetId":
                if (this.cubicModelAssetId != null)
                    this.client.unsubAsset(this.cubicModelAssetId, this.cubicModelSubscriber);
                this.cubicModelAssetId = value;
                this.cubicModelAsset = null;
                this.cubicModelRenderer.setCubicModel(null, null);
                if (this.cubicModelAssetId != null)
                    this.client.subAsset(this.cubicModelAssetId, "cubicModel", this.cubicModelSubscriber);
                break;
        }
    }
}
exports.default = CubicModelRendererUpdater;

},{}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CubicModelRenderer_1 = require("./CubicModelRenderer");
SupEngine.registerComponentClass("CubicModelRenderer", CubicModelRenderer_1.default);

},{"./CubicModelRenderer":1}]},{},[3]);
