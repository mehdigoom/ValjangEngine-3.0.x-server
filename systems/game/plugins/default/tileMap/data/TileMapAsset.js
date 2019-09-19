"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TileMapLayers_1 = require("./TileMapLayers");
const path = require("path");
const fs = require("fs");
class TileMapAsset extends SupCore.Data.Base.Asset {
    constructor(id, pub, server) {
        super(id, pub, TileMapAsset.schema, server);
    }
    init(options, callback) {
        this.server.data.resources.acquire("tileMapSettings", null, (err, tileMapSettings) => {
            this.server.data.resources.release("tileMapSettings", null);
            this.pub = {
                formatVersion: TileMapAsset.currentFormatVersion,
                tileSetId: null,
                pixelsPerUnit: tileMapSettings.pub.pixelsPerUnit,
                width: tileMapSettings.pub.width, height: tileMapSettings.pub.height,
                layerDepthOffset: tileMapSettings.pub.layerDepthOffset,
                layers: []
            };
            super.init(options, () => {
                this.layers.add(this.createEmptyLayer("Layer"), null, (err, index) => {
                    if (err != null) {
                        callback(err);
                        return;
                    }
                    callback(null);
                });
            });
        });
    }
    load(assetPath) {
        let pub;
        fs.readFile(path.join(assetPath, "tilemap.json"), { encoding: "utf8" }, (err, json) => {
            if (err != null && err.code === "ENOENT") {
                fs.readFile(path.join(assetPath, "asset.json"), { encoding: "utf8" }, (err, json) => {
                    fs.rename(path.join(assetPath, "asset.json"), path.join(assetPath, "tilemap.json"), (err) => {
                        pub = JSON.parse(json);
                        this._onLoaded(assetPath, pub);
                    });
                });
            }
            else {
                pub = JSON.parse(json);
                this._onLoaded(assetPath, pub);
            }
        });
    }
    migrate(assetPath, pub, callback) {
        if (pub.formatVersion === TileMapAsset.currentFormatVersion) {
            callback(false);
            return;
        }
        if (pub.formatVersion == null) {
            // NOTE: Legacy stuff from Superpowers 0.4
            if (typeof pub.tileSetId === "number")
                pub.tileSetId = pub.tileSetId.toString();
            // NOTE: Migration from Superpowers 0.13.1
            for (const layer of pub.layers) {
                for (let index = 0; index < layer.data.length; index++) {
                    if (layer.data[index][0] === -1)
                        layer.data[index] = 0;
                }
            }
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
        const json = JSON.stringify(this.pub, null);
        writeFile(path.join(outputPath, "tilemap.json"), json, { encoding: "utf8" }, callback);
    }
    setup() {
        this.layers = new TileMapLayers_1.default(this.pub.layers);
    }
    restore() {
        if (this.pub.tileSetId != null)
            this.emit("addDependencies", [this.pub.tileSetId]);
    }
    server_changeTileSet(client, tileSetId, callback) {
        if (tileSetId != null) {
            if (typeof (tileSetId) !== "string") {
                callback("tileSetId must be a string or null");
                return;
            }
            const entry = this.server.data.entries.byId[tileSetId];
            if (entry == null) {
                callback("Invalid tileSetId");
                return;
            }
            if (entry.type !== "tileSet") {
                callback("Invalid asset type");
                return;
            }
        }
        if (this.pub.tileSetId != null)
            this.emit("removeDependencies", [this.pub.tileSetId]);
        if (tileSetId != null)
            this.emit("addDependencies", [tileSetId]);
        this.pub.tileSetId = tileSetId;
        callback(null, null, tileSetId);
        this.emit("change");
    }
    client_changeTileSet(tileSetId) {
        this.pub.tileSetId = tileSetId;
    }
    server_resizeMap(client, width, height, callback) {
        if (typeof width !== "number" || width < 0) {
            callback("width must be positive integer");
            return;
        }
        if (typeof height !== "number" || height < 0) {
            callback("height must be positive integer");
            return;
        }
        if (width === this.pub.width && height === this.pub.height)
            return;
        this.client_resizeMap(width, height);
        callback(null, null, width, height);
        this.emit("change");
    }
    client_resizeMap(width, height) {
        if (width !== this.pub.width) {
            for (let row = this.pub.height; row > 0; row--) {
                for (const layer of this.pub.layers) {
                    if (width > this.pub.width) {
                        for (let i = 0; i < width - this.pub.width; i++)
                            layer.data.splice(row * this.pub.width, 0, 0);
                    }
                    else {
                        layer.data.splice((row - 1) * this.pub.width + width, this.pub.width - width);
                    }
                }
            }
            this.pub.width = width;
        }
        if (height !== this.pub.height) {
            for (const layer of this.pub.layers) {
                if (height > this.pub.height) {
                    for (let i = 0; i < (height - this.pub.height) * this.pub.width; i++)
                        layer.data.splice(this.pub.height * this.pub.width, 0, 0);
                }
                else {
                    layer.data.splice(height * this.pub.width, (this.pub.height - height) * this.pub.width);
                }
            }
            this.pub.height = height;
        }
    }
    server_moveMap(client, horizontalOffset, verticalOffset, callback) {
        if (typeof horizontalOffset !== "number") {
            callback("horizontalOffset must be an integer");
            return;
        }
        if (typeof verticalOffset !== "number") {
            callback("verticalOffset must be an integer");
            return;
        }
        if (horizontalOffset === 0 && verticalOffset === 0)
            return;
        this.client_moveMap(horizontalOffset, verticalOffset);
        callback(null, null, horizontalOffset, verticalOffset);
        this.emit("change");
    }
    client_moveMap(horizontalOffset, verticalOffset) {
        if (horizontalOffset !== 0) {
            for (let row = this.pub.height; row > 0; row--) {
                for (const layer of this.pub.layers) {
                    if (horizontalOffset > 0) {
                        layer.data.splice(row * this.pub.width - horizontalOffset, horizontalOffset);
                        for (let i = 0; i < horizontalOffset; i++)
                            layer.data.splice((row - 1) * this.pub.width, 0, 0);
                    }
                    else {
                        for (let i = 0; i < -horizontalOffset; i++)
                            layer.data.splice(row * this.pub.width, 0, 0);
                        layer.data.splice((row - 1) * this.pub.width, -horizontalOffset);
                    }
                }
            }
        }
        if (verticalOffset !== 0) {
            for (const layer of this.pub.layers) {
                if (verticalOffset > 0) {
                    layer.data.splice((this.pub.height - verticalOffset) * this.pub.width - 1, verticalOffset * this.pub.width);
                    for (let i = 0; i < verticalOffset * this.pub.width; i++)
                        layer.data.splice(0, 0, 0);
                }
                else {
                    for (let i = 0; i < -verticalOffset * this.pub.width; i++)
                        layer.data.splice(this.pub.height * this.pub.width, 0, 0);
                    layer.data.splice(0, -verticalOffset * this.pub.width);
                }
            }
        }
    }
    server_editMap(client, layerId, edits, callback) {
        if (typeof layerId !== "string" || this.layers.byId[layerId] == null) {
            callback("no such layer");
            return;
        }
        if (!Array.isArray(edits)) {
            callback("edits must be an array");
            return;
        }
        for (const edit of edits) {
            const x = edit.x;
            const y = edit.y;
            const tileValue = edit.tileValue;
            if (x == null || typeof x !== "number" || x < 0 || x >= this.pub.width) {
                callback(`x must be an integer between 0 && ${this.pub.width - 1}`);
                return;
            }
            if (y == null || typeof y !== "number" || y < 0 || y >= this.pub.height) {
                callback(`y must be an integer between 0 && ${this.pub.height - 1}`);
                return;
            }
            if (tileValue === 0)
                continue;
            if (!Array.isArray(tileValue) || tileValue.length !== 5) {
                callback("tileValue must be an array with 5 items");
                return;
            }
            if (typeof tileValue[0] !== "number" || tileValue[0] < -1) {
                callback("tileX must be an integer greater than -1");
                return;
            }
            if (typeof tileValue[1] !== "number" || tileValue[1] < -1) {
                callback("tileY must be an integer greater than -1");
                return;
            }
            if (typeof tileValue[2] !== "boolean") {
                callback("flipX must be a boolean");
                return;
            }
            if (typeof tileValue[3] !== "boolean") {
                callback("flipY must be a boolean");
                return;
            }
            if (typeof tileValue[4] !== "number" || [0, 90, 180, 270].indexOf(tileValue[4]) === -1) {
                callback("angle must be an integer in [0, 90, 180, 270]");
                return;
            }
        }
        this.client_editMap(layerId, edits);
        callback(null, null, layerId, edits);
        this.emit("change");
    }
    client_editMap(layerId, edits) {
        for (const edit of edits) {
            const index = edit.y * this.pub.width + edit.x;
            this.layers.byId[layerId].data[index] = edit.tileValue;
        }
    }
    createEmptyLayer(layerName) {
        const newLayer = {
            id: null,
            name: layerName,
            data: []
        };
        for (let y = 0; y < this.pub.height; y++) {
            for (let x = 0; x < this.pub.width; x++) {
                const index = y * this.pub.width + x;
                newLayer.data[index] = 0;
            }
        }
        return newLayer;
    }
    server_newLayer(client, layerName, index, callback) {
        const newLayer = this.createEmptyLayer(layerName);
        this.layers.add(newLayer, index, (err, actualIndex) => {
            if (err != null) {
                callback(err);
                return;
            }
            callback(null, newLayer.id, newLayer, actualIndex);
            this.emit("change");
        });
    }
    client_newLayer(newLayer, actualIndex) {
        this.layers.client_add(newLayer, actualIndex);
    }
    server_renameLayer(client, layerId, newName, callback) {
        if (typeof layerId !== "string" || this.layers.byId[layerId] == null) {
            callback("no such layer");
            return;
        }
        this.layers.setProperty(layerId, "name", newName, (err) => {
            if (err != null) {
                callback(err);
                return;
            }
            callback(null, null, layerId, newName);
            this.emit("change");
        });
    }
    client_renameLayer(layerId, newName) {
        this.layers.client_setProperty(layerId, "name", newName);
    }
    server_deleteLayer(client, layerId, callback) {
        if (typeof layerId !== "string" || this.layers.byId[layerId] == null) {
            callback("no such layer");
            return;
        }
        if (this.pub.layers.length === 1) {
            callback("Last layer can't be deleted");
            return;
        }
        this.layers.remove(layerId, (err, index) => {
            if (err != null) {
                callback(err, null, null);
                return;
            }
            callback(null, null, layerId);
            this.emit("change");
        });
    }
    client_deleteLayer(layerId) {
        this.layers.client_remove(layerId);
    }
    server_moveLayer(client, layerId, layerIndex, callback) {
        if (typeof layerId !== "string" || this.layers.byId[layerId] == null) {
            callback("no such layer");
            return;
        }
        if (typeof layerIndex !== "number") {
            callback("index must be an integer");
            return;
        }
        this.layers.move(layerId, layerIndex, (err, index) => {
            if (err != null) {
                callback(err);
                return;
            }
            callback(null, null, layerId, index);
            this.emit("change");
        });
    }
    client_moveLayer(layerId, layerIndex) {
        this.layers.client_move(layerId, layerIndex);
    }
}
TileMapAsset.currentFormatVersion = 1;
TileMapAsset.schema = {
    formatVersion: { type: "integer" },
    tileSetId: { type: "string?" },
    pixelsPerUnit: { type: "number", minExcluded: 0, mutable: true },
    width: { type: "integer", min: 1 },
    height: { type: "integer", min: 1 },
    layerDepthOffset: { type: "number", mutable: true },
    layers: { type: "array" },
};
exports.default = TileMapAsset;
