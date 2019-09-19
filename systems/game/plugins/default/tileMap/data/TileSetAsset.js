"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs");
// Reference to THREE, client-side only
let THREE;
if (global.window != null && window.SupEngine != null)
    THREE = SupEngine.THREE;
class TileSetAsset extends SupCore.Data.Base.Asset {
    constructor(id, pub, server) {
        super(id, pub, TileSetAsset.schema, server);
    }
    init(options, callback) {
        this.server.data.resources.acquire("tileMapSettings", null, (err, tileMapSettings) => {
            this.server.data.resources.release("tileMapSettings", null);
            this.pub = {
                formatVersion: TileSetAsset.currentFormatVersion,
                image: new Buffer(0),
                grid: tileMapSettings.pub.grid,
                tileProperties: {}
            };
            super.init(options, callback);
        });
    }
    load(assetPath) {
        let pub;
        fs.readFile(path.join(assetPath, "tileset.json"), { encoding: "utf8" }, (err, json) => {
            if (err != null && err.code === "ENOENT") {
                fs.readFile(path.join(assetPath, "asset.json"), { encoding: "utf8" }, (err, json) => {
                    fs.rename(path.join(assetPath, "asset.json"), path.join(assetPath, "tileset.json"), (err) => {
                        pub = JSON.parse(json);
                        fs.readFile(path.join(assetPath, "image.dat"), (err, buffer) => {
                            pub.image = buffer;
                            this._onLoaded(assetPath, pub);
                        });
                    });
                });
            }
            else {
                pub = JSON.parse(json);
                fs.readFile(path.join(assetPath, "image.dat"), (err, buffer) => {
                    pub.image = buffer;
                    this._onLoaded(assetPath, pub);
                });
            }
        });
    }
    migrate(assetPath, pub, callback) {
        if (pub.formatVersion === TileSetAsset.currentFormatVersion) {
            callback(false);
            return;
        }
        if (pub.formatVersion == null) {
            // NOTE: gridSize was split into grid.width and .height in Superpowers 0.8
            if (pub["gridSize"] != null) {
                pub.grid = { width: pub["gridSize"], height: pub["gridSize"] };
                delete pub["gridSize"];
            }
            pub.formatVersion = 1;
        }
        callback(true);
    }
    client_load() { this.loadTexture(); }
    client_unload() { this.unloadTexture(); }
    save(outputPath, callback) {
        this.write(fs.writeFile, outputPath, callback);
    }
    clientExport(outputPath, callback) {
        this.write(SupApp.writeFile, outputPath, callback);
    }
    write(writeFile, outputPath, callback) {
        let buffer = this.pub.image;
        const texture = this.pub.texture;
        delete this.pub.image;
        delete this.pub.texture;
        const json = JSON.stringify(this.pub, null, 2);
        this.pub.image = buffer;
        this.pub.texture = texture;
        if (buffer instanceof ArrayBuffer)
            buffer = new Buffer(buffer);
        writeFile(path.join(outputPath, "tileset.json"), json, { encoding: "utf8" }, () => {
            writeFile(path.join(outputPath, "image.dat"), buffer, callback);
        });
    }
    loadTexture() {
        this.unloadTexture();
        const buffer = this.pub.image;
        if (buffer.byteLength === 0)
            return;
        const image = new Image;
        const texture = this.pub.texture = new THREE.Texture(image);
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        const typedArray = new Uint8Array(buffer);
        const blob = new Blob([typedArray], { type: "image/*" });
        image.src = this.url = URL.createObjectURL(blob);
        if (!image.complete)
            image.addEventListener("load", () => { texture.needsUpdate = true; });
    }
    unloadTexture() {
        if (this.url != null)
            URL.revokeObjectURL(this.url);
        if (this.pub.texture != null)
            this.pub.texture.dispose();
        this.url = null;
        this.pub.texture = null;
    }
    server_upload(client, image, callback) {
        if (!(image instanceof Buffer)) {
            callback("Image must be an ArrayBuffer");
            return;
        }
        this.pub.image = image;
        callback(null, null, image);
        this.emit("change");
    }
    client_upload(image) {
        this.pub.image = image;
        this.loadTexture();
    }
    server_addTileProperty(client, tile, name, callback) {
        if (typeof (tile) !== "object" ||
            tile.x == null || typeof (tile.x) !== "number" ||
            tile.y == null || typeof (tile.y) !== "number") {
            callback("Invalid tile location");
            return;
        }
        if (typeof (name) !== "string") {
            callback("Invalid property name");
            return;
        }
        const properties = {};
        properties[name] = "";
        const violation = SupCore.Data.Base.getRuleViolation(properties, TileSetAsset.schema["tileProperties"].values, true);
        if (violation != null) {
            callback(`Invalid property: ${SupCore.Data.Base.formatRuleViolation(violation)}`);
            return;
        }
        if (this.pub.tileProperties[`${tile.x}_${tile.y}`] != null &&
            this.pub.tileProperties[`${tile.x}_${tile.y}`][name] != null) {
            callback(`Property ${name} already exists`);
            return;
        }
        if (this.pub.tileProperties[`${tile.x}_${tile.y}`] == null)
            this.pub.tileProperties[`${tile.x}_${tile.y}`] = {};
        this.pub.tileProperties[`${tile.x}_${tile.y}`][name] = "";
        callback(null, null, tile, name);
        this.emit("change");
    }
    client_addTileProperty(tile, name) {
        if (this.pub.tileProperties[`${tile.x}_${tile.y}`] == null)
            this.pub.tileProperties[`${tile.x}_${tile.y}`] = {};
        this.pub.tileProperties[`${tile.x}_${tile.y}`][name] = "";
    }
    server_renameTileProperty(client, tile, name, newName, callback) {
        if (typeof (tile) !== "object" ||
            tile.x == null || typeof (tile.x) !== "number" ||
            tile.y == null || typeof (tile.y) !== "number") {
            callback("Invalid tile location");
            return;
        }
        if (typeof (name) !== "string") {
            callback("Invalid property name");
            return;
        }
        if (typeof (newName) !== "string") {
            callback("Invalid new property name");
            return;
        }
        if (this.pub.tileProperties[`${tile.x}_${tile.y}`] == null) {
            callback(`Tile ${tile.x}_${tile.y} doesn't have any property`);
            return;
        }
        const properties = {};
        properties[newName] = "";
        const violation = SupCore.Data.Base.getRuleViolation(properties, TileSetAsset.schema["tileProperties"].values, true);
        if (violation != null) {
            callback(`Invalid property: ${SupCore.Data.Base.formatRuleViolation(violation)}`);
            return;
        }
        if (this.pub.tileProperties[`${tile.x}_${tile.y}`][name] == null) {
            callback(`Property ${name} doesn't exists`);
            return;
        }
        if (this.pub.tileProperties[`${tile.x}_${tile.y}`][newName] != null) {
            callback(`Property ${newName} already exists`);
            return;
        }
        this.pub.tileProperties[`${tile.x}_${tile.y}`][newName] = this.pub.tileProperties[`${tile.x}_${tile.y}`][name];
        delete this.pub.tileProperties[`${tile.x}_${tile.y}`][name];
        callback(null, null, tile, name, newName);
        this.emit("change");
    }
    client_renameTileProperty(tile, name, newName) {
        this.pub.tileProperties[`${tile.x}_${tile.y}`][newName] = this.pub.tileProperties[`${tile.x}_${tile.y}`][name];
        delete this.pub.tileProperties[`${tile.x}_${tile.y}`][name];
    }
    server_deleteTileProperty(client, tile, name, callback) {
        if (typeof (tile) !== "object" ||
            tile.x == null || typeof (tile.x) !== "number" ||
            tile.y == null || typeof (tile.y) !== "number") {
            callback("Invalid tile location");
            return;
        }
        if (this.pub.tileProperties[`${tile.x}_${tile.y}`] == null) {
            callback(`Tile ${tile.x}_${tile.y} doesn't have any property`);
            return;
        }
        if (typeof (name) !== "string") {
            callback("Invalid property name");
            return;
        }
        if (this.pub.tileProperties[`${tile.x}_${tile.y}`][name] == null) {
            callback(`Property ${name} doesn't exists`);
            return;
        }
        delete this.pub.tileProperties[`${tile.x}_${tile.y}`][name];
        if (Object.keys(this.pub.tileProperties[`${tile.x}_${tile.y}`]).length === 0)
            delete this.pub.tileProperties[`${tile.x}_${tile.y}`];
        callback(null, null, tile, name);
        this.emit("change");
    }
    client_deleteTileProperty(tile, name) {
        delete this.pub.tileProperties[`${tile.x}_${tile.y}`][name];
        if (Object.keys(this.pub.tileProperties[`${tile.x}_${tile.y}`]).length === 0)
            delete this.pub.tileProperties[`${tile.x}_${tile.y}`];
    }
    server_editTileProperty(client, tile, name, value, callback) {
        if (typeof (tile) !== "object" ||
            tile.x == null || typeof (tile.x) !== "number" ||
            tile.y == null || typeof (tile.y) !== "number") {
            callback("Invalid tile location");
            return;
        }
        if (this.pub.tileProperties[`${tile.x}_${tile.y}`] == null) {
            callback(`Tile ${tile.x}_${tile.y} doesn't have any property`);
            return;
        }
        if (typeof (name) !== "string") {
            callback("Invalid property name");
            return;
        }
        if (this.pub.tileProperties[`${tile.x}_${tile.y}`][name] == null) {
            callback(`Property ${name} doesn't exists`);
            return;
        }
        if (typeof (value) !== "string") {
            callback("Invalid property value");
            return;
        }
        const properties = {};
        properties[name] = value;
        const violation = SupCore.Data.Base.getRuleViolation(properties, TileSetAsset.schema["tileProperties"].values, true);
        if (violation != null) {
            callback(`Invalid property: ${SupCore.Data.Base.formatRuleViolation(violation)}`);
            return;
        }
        this.pub.tileProperties[`${tile.x}_${tile.y}`][name] = value;
        callback(null, null, tile, name, value);
        this.emit("change");
    }
    client_editTileProperty(tile, name, value) {
        this.pub.tileProperties[`${tile.x}_${tile.y}`][name] = value;
    }
}
TileSetAsset.currentFormatVersion = 1;
TileSetAsset.schema = {
    formatVersion: { type: "integer" },
    image: { type: "buffer" },
    grid: {
        type: "hash",
        properties: {
            width: { type: "integer", min: 1, mutable: true },
            height: { type: "integer", min: 1, mutable: true }
        }
    },
    tileProperties: {
        type: "hash",
        values: {
            type: "hash",
            keys: { minLength: 1, maxLength: 80 },
            values: { type: "string", minLength: 0, maxLength: 80 }
        }
    }
};
exports.default = TileSetAsset;
