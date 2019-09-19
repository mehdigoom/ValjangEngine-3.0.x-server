"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const THREE = SupEngine.THREE;
const fs = require("fs");
const TileLayerGeometry_1 = require("./TileLayerGeometry");
const TileMapRendererUpdater_1 = require("./TileMapRendererUpdater");
class TileMapRenderer extends SupEngine.ActorComponent {
    constructor(actor) {
        super(actor, "TileMapRenderer");
        this.castShadow = false;
        this.receiveShadow = false;
        this.materialType = "basic";
        this.onSetTileAt = (layerIndex, x, y) => { this.refreshTileAt(layerIndex, x, y); };
    }
    setTileMap(asset, materialType, customShader) {
        if (this.layerMeshes != null)
            this._clearLayerMeshes();
        this.tileMap = asset;
        if (materialType != null)
            this.materialType = materialType;
        this.customShader = customShader;
        if (this.tileSet == null || this.tileSet.data.texture == null || this.tileMap == null)
            return;
        this._createLayerMeshes();
    }
    setTileSet(asset) {
        if (this.layerMeshes != null)
            this._clearLayerMeshes();
        this.tileSet = asset;
        if (this.tileSet == null || this.tileSet.data.texture == null)
            return;
        this.tilesPerRow = this.tileSet.data.texture.image.width / this.tileSet.data.grid.width;
        this.tilesPerColumn = this.tileSet.data.texture.image.height / this.tileSet.data.grid.height;
        if (this.tileMap != null)
            this._createLayerMeshes();
    }
    _createLayerMeshes() {
        this.layerMeshes = [];
        this.layerMeshesById = {};
        this.layerVisibleById = {};
        for (let layerIndex = 0; layerIndex < this.tileMap.getLayersCount(); layerIndex++) {
            const layerId = this.tileMap.getLayerId(layerIndex);
            this.addLayer(layerId, layerIndex);
        }
        this.setCastShadow(this.castShadow);
        this.tileMap.on("setTileAt", this.onSetTileAt);
    }
    _clearLayerMeshes() {
        for (const layerMesh of this.layerMeshes) {
            layerMesh.geometry.dispose();
            layerMesh.material.dispose();
            this.actor.threeObject.remove(layerMesh);
        }
        this.layerMeshes = null;
        this.layerMeshesById = null;
        this.layerVisibleById = null;
        this.tileMap.removeListener("setTileAt", this.onSetTileAt);
    }
    _destroy() {
        if (this.layerMeshes != null)
            this._clearLayerMeshes();
        this.tileMap = null;
        this.tileSet = null;
        super._destroy();
    }
    addLayer(layerId, layerIndex) {
        const width = this.tileMap.getWidth() * this.tileSet.data.grid.width;
        const height = this.tileMap.getHeight() * this.tileSet.data.grid.height;
        const geometry = new TileLayerGeometry_1.default(width, height, this.tileMap.getWidth(), this.tileMap.getHeight());
        let shaderData;
        let defaultUniforms;
        switch (this.materialType) {
            case "basic":
                shaderData = {
                    formatVersion: null,
                    vertexShader: { text: THREE.ShaderLib.basic.vertexShader, draft: null, revisionId: null },
                    fragmentShader: { text: fs.readFileSync(`${__dirname}/TileMapBasicFragmentShader.glsl`, { encoding: "utf8" }), draft: null, revisionId: null },
                    uniforms: [{ id: null, name: "map", type: "t", value: "map" }],
                    attributes: [],
                    useLightUniforms: false
                };
                defaultUniforms = THREE.ShaderLib.basic.uniforms;
                break;
            case "phong":
                shaderData = {
                    formatVersion: null,
                    vertexShader: { text: THREE.ShaderLib.phong.vertexShader, draft: null, revisionId: null },
                    fragmentShader: { text: fs.readFileSync(`${__dirname}/TileMapPhongFragmentShader.glsl`, { encoding: "utf8" }), draft: null, revisionId: null },
                    uniforms: [{ id: null, name: "map", type: "t", value: "map" }],
                    attributes: [],
                    useLightUniforms: true
                };
                defaultUniforms = THREE.ShaderLib.phong.uniforms;
                break;
            case "shader":
                shaderData = this.customShader;
                break;
        }
        const material = SupEngine.componentClasses["Shader"].createShaderMaterial(shaderData, { map: this.tileSet.data.texture }, geometry, { defaultUniforms });
        material.map = this.tileSet.data.texture;
        material.alphaTest = 0.1;
        material.side = THREE.DoubleSide;
        material.transparent = true;
        const layerMesh = new THREE.Mesh(geometry, material);
        layerMesh.receiveShadow = this.receiveShadow;
        const scaleRatio = 1 / this.tileMap.getPixelsPerUnit();
        layerMesh.scale.set(scaleRatio, scaleRatio, 1);
        layerMesh.updateMatrixWorld(false);
        this.layerMeshes.splice(layerIndex, 0, layerMesh);
        this.layerMeshesById[layerId] = layerMesh;
        this.layerVisibleById[layerId] = true;
        this.actor.threeObject.add(layerMesh);
        for (let y = 0; y < this.tileMap.getHeight(); y++) {
            for (let x = 0; x < this.tileMap.getWidth(); x++) {
                this.refreshTileAt(layerIndex, x, y);
            }
        }
        this.refreshLayersDepth();
    }
    deleteLayer(layerIndex) {
        this.actor.threeObject.remove(this.layerMeshes[layerIndex]);
        this.layerMeshes.splice(layerIndex, 1);
        this.refreshLayersDepth();
    }
    moveLayer(layerId, newIndex) {
        const layer = this.layerMeshesById[layerId];
        const oldIndex = this.layerMeshes.indexOf(layer);
        this.layerMeshes.splice(oldIndex, 1);
        if (oldIndex < newIndex)
            newIndex--;
        this.layerMeshes.splice(newIndex, 0, layer);
        this.refreshLayersDepth();
    }
    setCastShadow(castShadow) {
        this.castShadow = castShadow;
        for (const layerMesh of this.layerMeshes)
            layerMesh.castShadow = castShadow;
        if (!castShadow)
            return;
        this.actor.gameInstance.threeScene.traverse((object) => {
            const material = object.material;
            if (material != null)
                material.needsUpdate = true;
        });
    }
    setReceiveShadow(receiveShadow) {
        this.receiveShadow = receiveShadow;
        for (const layerMesh of this.layerMeshes) {
            layerMesh.receiveShadow = receiveShadow;
            layerMesh.material.needsUpdate = true;
        }
    }
    refreshPixelsPerUnit(pixelsPerUnit) {
        const scaleRatio = 1 / this.tileMap.getPixelsPerUnit();
        for (const layerMesh of this.layerMeshes) {
            layerMesh.scale.set(scaleRatio, scaleRatio, 1);
            layerMesh.updateMatrixWorld(false);
        }
    }
    refreshLayersDepth() {
        for (let layerMeshIndex = 0; layerMeshIndex < this.layerMeshes.length; layerMeshIndex++) {
            const layerMesh = this.layerMeshes[layerMeshIndex];
            layerMesh.position.setZ(layerMeshIndex * this.tileMap.getLayersDepthOffset());
            layerMesh.updateMatrixWorld(false);
        }
    }
    refreshEntireMap() {
        for (let layerIndex = 0; layerIndex < this.tileMap.getLayersCount(); layerIndex++) {
            for (let y = 0; y < this.tileMap.getWidth(); y++) {
                for (let x = 0; x < this.tileMap.getHeight(); x++) {
                    this.refreshTileAt(layerIndex, x, y);
                }
            }
        }
        this.refreshLayersDepth();
    }
    refreshTileAt(layerIndex, x, y) {
        let tileX = -1;
        let tileY = -1;
        let flipX = false;
        let flipY = false;
        let angle = 0;
        const tileInfo = this.tileMap.getTileAt(layerIndex, x, y);
        if (tileInfo !== 0) {
            tileX = tileInfo[0];
            tileY = tileInfo[1];
            flipX = tileInfo[2];
            flipY = tileInfo[3];
            angle = tileInfo[4];
        }
        const quadIndex = (x + y * this.tileMap.getWidth());
        const layerMesh = this.layerMeshes[layerIndex];
        const uvs = layerMesh.geometry.getAttribute("uv");
        uvs.needsUpdate = true;
        const uvsArray = uvs.array;
        if (tileX === -1 || tileY === -1 || tileX >= this.tilesPerRow || tileY >= this.tilesPerColumn) {
            for (let i = 0; i < 8; i++)
                uvsArray[quadIndex * 8 + i] = -1;
            return;
        }
        const image = this.tileSet.data.texture.image;
        let left = (tileX * this.tileSet.data.grid.width + 0.2) / image.width;
        let right = ((tileX + 1) * this.tileSet.data.grid.width - 0.2) / image.width;
        let bottom = 1 - ((tileY + 1) * this.tileSet.data.grid.height - 0.2) / image.height;
        let top = 1 - (tileY * this.tileSet.data.grid.height + 0.2) / image.height;
        if (flipX)
            [right, left] = [left, right];
        if (flipY)
            [top, bottom] = [bottom, top];
        switch (angle) {
            case 0:
                uvsArray[quadIndex * 8 + 0] = left;
                uvsArray[quadIndex * 8 + 1] = bottom;
                uvsArray[quadIndex * 8 + 2] = right;
                uvsArray[quadIndex * 8 + 3] = bottom;
                uvsArray[quadIndex * 8 + 4] = right;
                uvsArray[quadIndex * 8 + 5] = top;
                uvsArray[quadIndex * 8 + 6] = left;
                uvsArray[quadIndex * 8 + 7] = top;
                break;
            case 90:
                uvsArray[quadIndex * 8 + 0] = left;
                uvsArray[quadIndex * 8 + 1] = top;
                uvsArray[quadIndex * 8 + 2] = left;
                uvsArray[quadIndex * 8 + 3] = bottom;
                uvsArray[quadIndex * 8 + 4] = right;
                uvsArray[quadIndex * 8 + 5] = bottom;
                uvsArray[quadIndex * 8 + 6] = right;
                uvsArray[quadIndex * 8 + 7] = top;
                break;
            case 180:
                uvsArray[quadIndex * 8 + 0] = right;
                uvsArray[quadIndex * 8 + 1] = top;
                uvsArray[quadIndex * 8 + 2] = left;
                uvsArray[quadIndex * 8 + 3] = top;
                uvsArray[quadIndex * 8 + 4] = left;
                uvsArray[quadIndex * 8 + 5] = bottom;
                uvsArray[quadIndex * 8 + 6] = right;
                uvsArray[quadIndex * 8 + 7] = bottom;
                break;
            case 270:
                uvsArray[quadIndex * 8 + 0] = right;
                uvsArray[quadIndex * 8 + 1] = bottom;
                uvsArray[quadIndex * 8 + 2] = right;
                uvsArray[quadIndex * 8 + 3] = top;
                uvsArray[quadIndex * 8 + 4] = left;
                uvsArray[quadIndex * 8 + 5] = top;
                uvsArray[quadIndex * 8 + 6] = left;
                uvsArray[quadIndex * 8 + 7] = bottom;
                break;
        }
    }
    setIsLayerActive(active) {
        if (this.layerMeshes == null)
            return;
        for (const layerId in this.layerMeshesById)
            this.layerMeshesById[layerId].visible = active && this.layerVisibleById[layerId];
    }
}
/* tslint:disable:variable-name */
TileMapRenderer.Updater = TileMapRendererUpdater_1.default;
exports.default = TileMapRenderer;
