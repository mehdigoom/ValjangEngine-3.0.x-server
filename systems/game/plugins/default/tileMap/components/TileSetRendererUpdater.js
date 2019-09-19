"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TileSet_1 = require("./TileSet");
class TileSetRendererUpdater {
    constructor(client, tileSetRenderer, config, externalSubscriber) {
        this.client = client;
        this.tileSetRenderer = tileSetRenderer;
        this.externalSubscriber = externalSubscriber;
        this.onTileSetAssetReceived = (assetId, asset) => {
            this.prepareTexture(asset.pub.texture, () => {
                this.tileSetAsset = asset;
                if (asset.pub.texture != null) {
                    this.tileSetRenderer.setTileSet(new TileSet_1.default(asset.pub));
                    this.tileSetRenderer.gridRenderer.setGrid({
                        width: asset.pub.texture.image.width / asset.pub.grid.width,
                        height: asset.pub.texture.image.height / asset.pub.grid.height,
                        direction: -1,
                        orthographicScale: 10,
                        ratio: { x: 1, y: asset.pub.grid.width / asset.pub.grid.height }
                    });
                }
                if (this.externalSubscriber.onAssetReceived != null)
                    this.externalSubscriber.onAssetReceived(assetId, asset);
            });
        };
        this.onTileSetAssetEdited = (assetId, command, ...args) => {
            let callEditCallback = true;
            const commandFunction = this.onEditCommands[command];
            if (commandFunction != null && commandFunction(...args) === false)
                callEditCallback = false;
            if (callEditCallback && this.externalSubscriber.onAssetEdited != null) {
                this.externalSubscriber.onAssetEdited(assetId, command, ...args);
            }
        };
        this.onEditCommands = {
            upload: () => {
                const texture = this.tileSetAsset.pub.texture;
                this.prepareTexture(texture, () => {
                    this.tileSetRenderer.setTileSet(new TileSet_1.default(this.tileSetAsset.pub));
                    const width = texture.image.width / this.tileSetAsset.pub.grid.width;
                    const height = texture.image.height / this.tileSetAsset.pub.grid.height;
                    this.tileSetRenderer.gridRenderer.resize(width, height);
                    this.tileSetRenderer.gridRenderer.setRatio({ x: 1, y: this.tileSetAsset.pub.grid.width / this.tileSetAsset.pub.grid.height });
                    if (this.externalSubscriber.onAssetEdited != null) {
                        this.externalSubscriber.onAssetEdited(this.tileSetAsset.id, "upload");
                    }
                });
                return false;
            },
            setProperty: (key, value) => {
                switch (key) {
                    case "grid.width":
                    case "grid.height":
                        this.tileSetRenderer.refreshScaleRatio();
                        const width = this.tileSetAsset.pub.texture.image.width / this.tileSetAsset.pub.grid.width;
                        const height = this.tileSetAsset.pub.texture.image.height / this.tileSetAsset.pub.grid.height;
                        this.tileSetRenderer.gridRenderer.resize(width, height);
                        this.tileSetRenderer.gridRenderer.setRatio({ x: 1, y: this.tileSetAsset.pub.grid.width / this.tileSetAsset.pub.grid.height });
                        break;
                }
            }
        };
        this.onTileSetAssetTrashed = (assetId) => {
            this.tileSetRenderer.setTileSet(null);
            if (this.externalSubscriber.onAssetTrashed != null)
                this.externalSubscriber.onAssetTrashed(assetId);
        };
        this.client = client;
        this.tileSetRenderer = tileSetRenderer;
        this.tileSetAssetId = config.tileSetAssetId;
        if (this.externalSubscriber == null)
            this.externalSubscriber = {};
        this.tileSetSubscriber = {
            onAssetReceived: this.onTileSetAssetReceived,
            onAssetEdited: this.onTileSetAssetEdited,
            onAssetTrashed: this.onTileSetAssetTrashed
        };
        if (this.tileSetAssetId != null)
            this.client.subAsset(this.tileSetAssetId, "tileSet", this.tileSetSubscriber);
    }
    destroy() {
        if (this.tileSetAssetId != null) {
            this.client.unsubAsset(this.tileSetAssetId, this.tileSetSubscriber);
        }
    }
    changeTileSetId(tileSetId) {
        if (this.tileSetAssetId != null)
            this.client.unsubAsset(this.tileSetAssetId, this.tileSetSubscriber);
        this.tileSetAssetId = tileSetId;
        this.tileSetAsset = null;
        this.tileSetRenderer.setTileSet(null);
        this.tileSetRenderer.gridRenderer.resize(1, 1);
        if (this.tileSetAssetId != null)
            this.client.subAsset(this.tileSetAssetId, "tileSet", this.tileSetSubscriber);
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
}
exports.default = TileSetRendererUpdater;
