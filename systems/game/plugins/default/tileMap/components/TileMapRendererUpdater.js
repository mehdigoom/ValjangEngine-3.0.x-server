"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TileMap_1 = require("./TileMap");
const TileSet_1 = require("./TileSet");
class TileMapRendererUpdater {
    constructor(client, tileMapRenderer, config, externalSubscribers) {
        this.client = client;
        this.tileMapRenderer = tileMapRenderer;
        this.externalSubscribers = externalSubscribers;
        this.onTileMapAssetReceived = (assetId, asset) => {
            this.tileMapAsset = asset;
            this.setTileMap();
            if (this.tileMapAsset.pub.tileSetId != null)
                this.client.subAsset(this.tileMapAsset.pub.tileSetId, "tileSet", this.tileSetSubscriber);
            const subscriber = this.externalSubscribers.tileMap;
            if (subscriber.onAssetReceived != null)
                subscriber.onAssetReceived(assetId, asset);
        };
        this.onTileMapAssetEdited = (assetId, command, ...args) => {
            if (this.tileSetAsset != null || command === "changeTileSet") {
                const commandFunction = this.onEditCommands[command];
                if (commandFunction != null)
                    commandFunction.apply(this, args);
            }
            const subscriber = this.externalSubscribers.tileMap;
            if (subscriber.onAssetEdited)
                subscriber.onAssetEdited(assetId, command, ...args);
        };
        this.onEditCommands = {
            changeTileSet: () => {
                if (this.tileSetAssetId != null)
                    this.client.unsubAsset(this.tileSetAssetId, this.tileSetSubscriber);
                this.tileSetAsset = null;
                this.tileMapRenderer.setTileSet(null);
                this.tileSetAssetId = this.tileMapAsset.pub.tileSetId;
                if (this.tileSetAssetId != null)
                    this.client.subAsset(this.tileSetAssetId, "tileSet", this.tileSetSubscriber);
            },
            resizeMap: () => { this.setTileMap(); },
            moveMap: () => { this.tileMapRenderer.refreshEntireMap(); },
            setProperty: (path, value) => {
                switch (path) {
                    case "pixelsPerUnit":
                        this.tileMapRenderer.refreshPixelsPerUnit(value);
                        break;
                    case "layerDepthOffset":
                        this.tileMapRenderer.refreshLayersDepth();
                        break;
                }
            },
            editMap: (layerId, edits) => {
                const index = this.tileMapAsset.pub.layers.indexOf(this.tileMapAsset.layers.byId[layerId]);
                for (const edit of edits)
                    this.tileMapRenderer.refreshTileAt(index, edit.x, edit.y);
            },
            newLayer: (layer, index) => { this.tileMapRenderer.addLayer(layer.id, index); },
            deleteLayer: (id, index) => { this.tileMapRenderer.deleteLayer(index); },
            moveLayer: (id, newIndex) => { this.tileMapRenderer.moveLayer(id, newIndex); }
        };
        this.onTileMapAssetTrashed = (assetId) => {
            this.tileMapRenderer.setTileMap(null);
            const subscriber = this.externalSubscribers.tileMap;
            if (subscriber.onAssetTrashed != null)
                subscriber.onAssetTrashed(assetId);
        };
        this.onTileSetAssetReceived = (assetId, asset) => {
            this.prepareTexture(asset.pub.texture, () => {
                this.tileSetAsset = asset;
                this.tileMapRenderer.setTileSet(new TileSet_1.default(asset.pub));
                const subscriber = this.externalSubscribers.tileSet;
                if (subscriber.onAssetReceived != null)
                    subscriber.onAssetReceived(assetId, asset);
            });
        };
        this.onTileSetAssetEdited = (assetId, command, ...args) => {
            const commandFunction = this.onTileSetEditCommands[command];
            if (commandFunction != null)
                commandFunction.apply(this, args);
            const subscriber = this.externalSubscribers.tileSet;
            if (subscriber.onAssetEdited)
                subscriber.onAssetEdited(assetId, command, ...args);
        };
        this.onTileSetEditCommands = {
            upload() {
                this.prepareTexture(this.tileSetAsset.pub.texture, () => {
                    this.tileMapRenderer.setTileSet(new TileSet_1.default(this.tileSetAsset.pub));
                });
            },
            setProperty() {
                this.tileMapRenderer.setTileSet(new TileSet_1.default(this.tileSetAsset.pub));
            }
        };
        this.onTileSetAssetTrashed = (assetId) => {
            this.tileMapRenderer.setTileSet(null);
            const subscriber = this.externalSubscribers.tileSet;
            if (subscriber.onAssetTrashed)
                subscriber.onAssetTrashed(assetId);
        };
        this.onShaderAssetReceived = (assetId, asset) => {
            this.shaderPub = asset.pub;
            this.setTileMap();
        };
        this.onShaderAssetEdited = (id, command, ...args) => {
            if (command !== "editVertexShader" && command !== "editFragmentShader")
                this.setTileMap();
        };
        this.onShaderAssetTrashed = () => {
            this.shaderPub = null;
            this.setTileMap();
        };
        this.tileMapAssetId = config.tileMapAssetId;
        this.tileSetAssetId = config.tileSetAssetId;
        this.materialType = config.materialType;
        this.shaderAssetId = config.shaderAssetId;
        this.tileMapRenderer.receiveShadow = config.receiveShadow;
        if (this.externalSubscribers == null)
            this.externalSubscribers = {};
        if (this.externalSubscribers.tileMap == null)
            this.externalSubscribers.tileMap = {};
        if (this.externalSubscribers.tileSet == null)
            this.externalSubscribers.tileSet = {};
        this.tileMapSubscriber = {
            onAssetReceived: this.onTileMapAssetReceived,
            onAssetEdited: this.onTileMapAssetEdited,
            onAssetTrashed: this.onTileMapAssetTrashed
        };
        this.tileSetSubscriber = {
            onAssetReceived: this.onTileSetAssetReceived,
            onAssetEdited: this.onTileSetAssetEdited,
            onAssetTrashed: this.onTileSetAssetTrashed
        };
        this.shaderSubscriber = {
            onAssetReceived: this.onShaderAssetReceived,
            onAssetEdited: this.onShaderAssetEdited,
            onAssetTrashed: this.onShaderAssetTrashed
        };
        if (this.tileMapAssetId != null)
            this.client.subAsset(this.tileMapAssetId, "tileMap", this.tileMapSubscriber);
        if (this.shaderAssetId != null)
            this.client.subAsset(this.shaderAssetId, "shader", this.shaderSubscriber);
    }
    destroy() {
        if (this.tileMapAssetId != null)
            this.client.unsubAsset(this.tileMapAssetId, this.tileMapSubscriber);
        if (this.tileSetAssetId != null)
            this.client.unsubAsset(this.tileSetAssetId, this.tileSetSubscriber);
        if (this.shaderAssetId != null)
            this.client.unsubAsset(this.shaderAssetId, this.shaderSubscriber);
    }
    setTileMap() {
        if (this.tileMapAsset == null || (this.materialType === "shader" && this.shaderPub == null)) {
            this.tileMapRenderer.setTileMap(null);
            return;
        }
        this.tileMapRenderer.setTileMap(new TileMap_1.default(this.tileMapAsset.pub), this.materialType, this.shaderPub);
    }
    prepareTexture(texture, callback) {
        if (texture == null) {
            callback();
            return;
        }
        if (texture.image.complete)
            callback();
        else
            texture.image.addEventListener("load", callback);
    }
    config_setProperty(path, value) {
        switch (path) {
            case "tileMapAssetId":
                if (this.tileMapAssetId != null)
                    this.client.unsubAsset(this.tileMapAssetId, this.tileMapSubscriber);
                this.tileMapAssetId = value;
                this.tileMapAsset = null;
                this.tileMapRenderer.setTileMap(null);
                if (this.tileSetAssetId != null)
                    this.client.unsubAsset(this.tileSetAssetId, this.tileSetSubscriber);
                this.tileSetAsset = null;
                this.tileMapRenderer.setTileSet(null);
                if (this.tileMapAssetId != null)
                    this.client.subAsset(this.tileMapAssetId, "tileMap", this.tileMapSubscriber);
                break;
            // case "tileSetAssetId":
            case "castShadow":
                this.tileMapRenderer.setCastShadow(value);
                break;
            case "receiveShadow":
                this.tileMapRenderer.setReceiveShadow(value);
                break;
            case "materialType":
                this.materialType = value;
                this.setTileMap();
                break;
            case "shaderAssetId":
                if (this.shaderAssetId != null)
                    this.client.unsubAsset(this.shaderAssetId, this.shaderSubscriber);
                this.shaderAssetId = value;
                this.shaderPub = null;
                this.tileMapRenderer.setTileMap(null);
                if (this.shaderAssetId != null)
                    this.client.subAsset(this.shaderAssetId, "shader", this.shaderSubscriber);
                break;
        }
    }
}
exports.default = TileMapRendererUpdater;
