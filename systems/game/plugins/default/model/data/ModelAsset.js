"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs");
const async = require("async");
// Reference to THREE, client-side only
let THREE;
if (global.window != null && window.SupEngine != null)
    THREE = SupEngine.THREE;
const ModelAnimations_1 = require("./ModelAnimations");
class ModelAsset extends SupCore.Data.Base.Asset {
    constructor(id, pub, server) {
        super(id, pub, ModelAsset.schema, server);
    }
    init(options, callback) {
        this.pub = {
            formatVersion: ModelAsset.currentFormatVersion,
            unitRatio: 1,
            upAxisMatrix: null,
            attributes: {
                position: null,
                index: null,
                color: null,
                uv: null,
                normal: null,
                skinIndex: null,
                skinWeight: null
            },
            bones: null,
            maps: { map: new Buffer(0) },
            filtering: "pixelated",
            wrapping: "clampToEdge",
            animations: [],
            opacity: null,
            mapSlots: {
                map: "map",
                light: null,
                specular: null,
                alpha: null,
                normal: null
            }
        };
        super.init(options, callback);
    }
    setup() {
        this.animations = new ModelAnimations_1.default(this.pub.animations);
    }
    load(assetPath) {
        let pub;
        const loadAttributesMaps = () => {
            const mapNames = pub.maps;
            // NOTE: "diffuse" was renamed to "map" in Superpowers 0.11
            if (pub.formatVersion == null && mapNames.length === 1 && mapNames[0] === "diffuse")
                mapNames[0] = "map";
            pub.maps = {};
            pub.attributes = {};
            async.series([
                (callback) => {
                    async.each(Object.keys(ModelAsset.schema["attributes"].properties), (key, cb) => {
                        fs.readFile(path.join(assetPath, `attr-${key}.dat`), (err, buffer) => {
                            // TODO: Handle error but ignore ENOENT
                            if (err != null) {
                                cb();
                                return;
                            }
                            pub.attributes[key] = buffer;
                            cb();
                        });
                    }, (err) => { callback(err, null); });
                },
                (callback) => {
                    async.each(mapNames, (key, cb) => {
                        fs.readFile(path.join(assetPath, `map-${key}.dat`), (err, buffer) => {
                            // TODO: Handle error but ignore ENOENT
                            if (err != null) {
                                // NOTE: "diffuse" was renamed to "map" in Superpowers 0.11
                                if (err.code === "ENOENT" && key === "map") {
                                    fs.readFile(path.join(assetPath, "map-diffuse.dat"), (err, buffer) => {
                                        fs.rename(path.join(assetPath, "map-diffuse.dat"), path.join(assetPath, "map-map.dat"), (err) => {
                                            pub.maps[key] = buffer;
                                            cb();
                                        });
                                    });
                                }
                                else
                                    cb();
                                return;
                            }
                            pub.maps[key] = buffer;
                            cb();
                        });
                    }, (err) => { callback(err, null); });
                }
            ], (err) => { this._onLoaded(assetPath, pub); });
        };
        fs.readFile(path.join(assetPath, "model.json"), { encoding: "utf8" }, (err, json) => {
            // NOTE: "asset.json" was renamed to "model.json" in Superpowers 0.11
            if (err != null && err.code === "ENOENT") {
                fs.readFile(path.join(assetPath, "asset.json"), { encoding: "utf8" }, (err, json) => {
                    fs.rename(path.join(assetPath, "asset.json"), path.join(assetPath, "model.json"), (err) => {
                        pub = JSON.parse(json);
                        loadAttributesMaps();
                    });
                });
            }
            else {
                pub = JSON.parse(json);
                loadAttributesMaps();
            }
        });
    }
    migrate(assetPath, pub, callback) {
        if (pub.formatVersion === ModelAsset.currentFormatVersion) {
            callback(false);
            return;
        }
        if (pub.formatVersion == null) {
            // NOTE: New settings introduced in Superpowers 0.8
            if (typeof pub.opacity === "undefined")
                pub.opacity = 1;
            if (pub.advancedTextures == null) {
                pub.advancedTextures = false;
                pub.mapSlots = {
                    map: "map",
                    light: null,
                    specular: null,
                    alpha: null,
                    normal: null
                };
            }
            if (pub.unitRatio == null)
                pub.unitRatio = 1;
            // NOTE: Filtering and wrapping were introduced in Superpowers 0.13
            if (pub.filtering == null)
                pub.filtering = "pixelated";
            if (pub.wrapping == null)
                pub.wrapping = "clampToEdge";
            if (pub.animations == null)
                pub.animations = [];
            pub.formatVersion = 1;
        }
        if (pub.formatVersion === 1) {
            delete pub.advancedTextures;
            pub.formatVersion = 2;
        }
        callback(true);
    }
    client_load() {
        this.mapObjectURLs = {};
        this.loadTextures();
    }
    client_unload() {
        this.unloadTextures();
    }
    save(outputPath, callback) {
        this.write(fs.writeFile, outputPath, (err) => {
            if (err != null) {
                callback(err);
                return;
            }
            // Clean up old attributes and maps from disk
            async.series([
                (callback) => {
                    async.each(Object.keys(ModelAsset.schema["attributes"].properties), (key, cb) => {
                        const value = this.pub.attributes[key];
                        if (value != null) {
                            cb();
                            return;
                        }
                        fs.unlink(path.join(outputPath, `attr-${key}.dat`), (err) => {
                            if (err != null && err.code !== "ENOENT") {
                                cb(err);
                                return;
                            }
                            cb();
                        });
                    }, callback);
                },
                (callback) => {
                    async.each(Object.keys(this.pub.maps), (mapName, cb) => {
                        const value = this.pub.maps[mapName];
                        if (value != null) {
                            cb();
                            return;
                        }
                        fs.unlink(path.join(outputPath, `map-${mapName}.dat`), (err) => {
                            if (err != null && err.code !== "ENOENT") {
                                cb(err);
                                return;
                            }
                            cb();
                        });
                    }, callback);
                }
            ], callback);
        });
    }
    clientExport(outputPath, callback) {
        this.write(SupApp.writeFile, outputPath, callback);
    }
    write(writeFile, outputPath, writeCallback) {
        const attributes = this.pub.attributes;
        const maps = this.pub.maps;
        this.pub.attributes = [];
        for (const key in attributes) {
            if (attributes[key] != null)
                this.pub.attributes.push(key);
        }
        this.pub.maps = [];
        for (const mapName in maps) {
            if (maps[mapName] != null)
                this.pub.maps.push(mapName);
        }
        const textures = this.pub.textures;
        delete this.pub.textures;
        const json = JSON.stringify(this.pub, null, 2);
        this.pub.attributes = attributes;
        this.pub.maps = maps;
        this.pub.textures = textures;
        async.series([
            (callback) => { writeFile(path.join(outputPath, "model.json"), json, { encoding: "utf8" }, callback); },
            (callback) => {
                async.each(Object.keys(ModelAsset.schema["attributes"].properties), (key, cb) => {
                    let value = attributes[key];
                    if (value == null) {
                        cb();
                        return;
                    }
                    if (value instanceof ArrayBuffer)
                        value = new Buffer(value);
                    writeFile(path.join(outputPath, `attr-${key}.dat`), value, cb);
                }, callback);
            },
            (callback) => {
                async.each(Object.keys(maps), (mapName, cb) => {
                    let value = maps[mapName];
                    if (value == null) {
                        cb();
                        return;
                    }
                    if (value instanceof ArrayBuffer)
                        value = Buffer.from(value);
                    writeFile(path.join(outputPath, `map-${mapName}.dat`), value, cb);
                }, callback);
            }
        ], writeCallback);
    }
    unloadTextures() {
        for (const textureName in this.pub.textures)
            this.pub.textures[textureName].dispose();
        for (const key in this.mapObjectURLs) {
            URL.revokeObjectURL(this.mapObjectURLs[key]);
            delete this.mapObjectURLs[key];
        }
    }
    loadTextures() {
        this.unloadTextures();
        this.pub.textures = {};
        Object.keys(this.pub.maps).forEach((key) => {
            const buffer = this.pub.maps[key];
            if (buffer == null || buffer.byteLength === 0)
                return;
            let texture = this.pub.textures[key];
            let image = (texture != null) ? texture.image : null;
            if (image == null) {
                image = new Image;
                texture = this.pub.textures[key] = new THREE.Texture(image);
                if (this.pub.filtering === "pixelated") {
                    texture.magFilter = THREE.NearestFilter;
                    texture.minFilter = THREE.NearestFilter;
                }
                if (this.pub.wrapping === "repeat") {
                    texture.wrapS = SupEngine.THREE.RepeatWrapping;
                    texture.wrapT = SupEngine.THREE.RepeatWrapping;
                }
                else if (this.pub.wrapping === "mirroredRepeat") {
                    texture.wrapS = SupEngine.THREE.MirroredRepeatWrapping;
                    texture.wrapT = SupEngine.THREE.MirroredRepeatWrapping;
                }
                const typedArray = new Uint8Array(buffer);
                const blob = new Blob([typedArray], { type: "image/*" });
                image.src = this.mapObjectURLs[key] = URL.createObjectURL(blob);
            }
            if (!image.complete) {
                image.addEventListener("load", () => { texture.needsUpdate = true; });
            }
        });
    }
    client_setProperty(path, value) {
        super.client_setProperty(path, value);
        switch (path) {
            case "filtering":
                for (const textureName in this.pub.textures) {
                    const texture = this.pub.textures[textureName];
                    if (this.pub.filtering === "pixelated") {
                        texture.magFilter = THREE.NearestFilter;
                        texture.minFilter = THREE.NearestFilter;
                    }
                    else {
                        texture.magFilter = THREE.LinearFilter;
                        texture.minFilter = THREE.LinearMipMapLinearFilter;
                    }
                    texture.needsUpdate = true;
                }
                break;
            case "wrapping":
                for (const textureName in this.pub.textures) {
                    const texture = this.pub.textures[textureName];
                    if (value === "clampToEdge") {
                        texture.wrapS = SupEngine.THREE.ClampToEdgeWrapping;
                        texture.wrapT = SupEngine.THREE.ClampToEdgeWrapping;
                    }
                    else if (value === "repeat") {
                        texture.wrapS = SupEngine.THREE.RepeatWrapping;
                        texture.wrapT = SupEngine.THREE.RepeatWrapping;
                    }
                    else if (value === "mirroredRepeat") {
                        texture.wrapS = SupEngine.THREE.MirroredRepeatWrapping;
                        texture.wrapT = SupEngine.THREE.MirroredRepeatWrapping;
                    }
                    texture.needsUpdate = true;
                }
                break;
        }
    }
    server_setModel(client, upAxisMatrix, attributes, bones, callback) {
        // Validate up matrix
        if (upAxisMatrix != null) {
            const violation = SupCore.Data.Base.getRuleViolation(upAxisMatrix, ModelAsset.schema["upAxisMatrix"], true);
            if (violation != null) {
                callback(`Invalid up axis matrix: ${SupCore.Data.Base.formatRuleViolation(violation)}`);
                return;
            }
        }
        // Validate attributes
        if (attributes == null || typeof attributes !== "object") {
            callback("Attributes must be an object");
            return;
        }
        for (const key in attributes) {
            const value = attributes[key];
            if (ModelAsset.schema["attributes"].properties[key] == null) {
                callback(`Unsupported attribute type: ${key}`);
                return;
            }
            if (value != null && !(value instanceof Buffer)) {
                callback(`Value for ${key} must be an ArrayBuffer or null`);
                return;
            }
        }
        // Validate bones
        if (bones != null) {
            const violation = SupCore.Data.Base.getRuleViolation(bones, ModelAsset.schema["bones"], true);
            if (violation != null) {
                callback(`Invalid bones: ${SupCore.Data.Base.formatRuleViolation(violation)}`);
                return;
            }
        }
        // Apply changes
        this.pub.upAxisMatrix = upAxisMatrix;
        this.pub.attributes = attributes;
        this.pub.bones = bones;
        callback(null, null, upAxisMatrix, attributes, bones);
        this.emit("change");
    }
    client_setModel(upAxisMatrix, attributes, bones) {
        this.pub.upAxisMatrix = upAxisMatrix;
        this.pub.attributes = attributes;
        this.pub.bones = bones;
    }
    server_setMaps(client, maps, callback) {
        if (maps == null || typeof maps !== "object") {
            callback("Maps must be an object");
            return;
        }
        for (const mapName in maps) {
            const value = maps[mapName];
            if (this.pub.maps[mapName] == null) {
                callback(`The map ${mapName} doesn't exist`);
                return;
            }
            if (value != null && !(value instanceof Buffer)) {
                callback(`Value for ${mapName} must be an ArrayBuffer or null`);
                return;
            }
        }
        for (const mapName in maps)
            this.pub.maps[mapName] = maps[mapName];
        callback(null, null, maps);
        this.emit("change");
    }
    client_setMaps(maps) {
        for (const mapName in maps)
            this.pub.maps[mapName] = maps[mapName];
        this.loadTextures();
    }
    server_newMap(client, name, callback) {
        if (name == null || typeof name !== "string") {
            callback("Name of the map must be a string");
            return;
        }
        if (this.pub.maps[name] != null) {
            callback(`The map ${name} already exists`);
            return;
        }
        this.pub.maps[name] = new Buffer(0);
        callback(null, null, name);
        this.emit("change");
    }
    client_newMap(name) {
        this.pub.maps[name] = new Buffer(0);
    }
    server_deleteMap(client, name, callback) {
        if (name == null || typeof name !== "string") {
            callback("Name of the map must be a string");
            return;
        }
        if (this.pub.maps[name] == null) {
            callback(`The map ${name} doesn't exist`);
            return;
        }
        this.client_deleteMap(name);
        callback(null, null, name);
        this.emit("change");
    }
    client_deleteMap(name) {
        for (const slotName in this.pub.mapSlots) {
            const map = this.pub.mapSlots[slotName];
            if (map === name)
                this.pub.mapSlots[slotName] = null;
        }
        // NOTE: do not delete, the key must exist so the file can be deleted from the disk when the asset is saved
        this.pub.maps[name] = null;
    }
    server_renameMap(client, oldName, newName, callback) {
        if (oldName == null || typeof oldName !== "string") {
            callback("Name of the map must be a string");
            return;
        }
        if (newName == null || typeof newName !== "string") {
            callback("New name of the map must be a string");
            return;
        }
        if (this.pub.maps[newName] != null) {
            callback(`The map ${newName} already exists`);
            return;
        }
        this.client_renameMap(oldName, newName);
        callback(null, null, oldName, newName);
        this.emit("change");
    }
    client_renameMap(oldName, newName) {
        this.pub.maps[newName] = this.pub.maps[oldName];
        this.pub.maps[oldName] = null;
        for (const slotName in this.pub.mapSlots) {
            const map = this.pub.mapSlots[slotName];
            if (map === oldName)
                this.pub.mapSlots[slotName] = newName;
        }
    }
    server_setMapSlot(client, slot, map, callback) {
        if (slot == null || typeof slot !== "string") {
            callback("Name of the slot must be a string");
            return;
        }
        if (map != null && typeof map !== "string") {
            callback("Name of the map must be a string");
            return;
        }
        if (map != null && this.pub.maps[map] == null) {
            callback(`The map ${map} doesn't exist`);
            return;
        }
        this.pub.mapSlots[slot] = map;
        callback(null, null, slot, map);
        this.emit("change");
    }
    client_setMapSlot(slot, map) {
        this.pub.mapSlots[slot] = map;
    }
    // Animations
    server_newAnimation(client, name, duration, keyFrames, callback) {
        if (duration == null)
            duration = 0;
        if (keyFrames == null)
            keyFrames = [];
        const animation = { name, duration, keyFrames };
        this.animations.add(animation, null, (err, actualIndex) => {
            if (err != null) {
                callback(err);
                return;
            }
            animation.name = SupCore.Data.ensureUniqueName(animation.id, animation.name, this.animations.pub);
            callback(null, animation.id, animation, actualIndex);
            this.emit("change");
        });
    }
    client_newAnimation(animation, actualIndex) {
        this.animations.client_add(animation, actualIndex);
    }
    server_deleteAnimation(client, id, callback) {
        this.animations.remove(id, (err) => {
            if (err != null) {
                callback(err);
                return;
            }
            callback(null, null, id);
            this.emit("change");
        });
    }
    client_deleteAnimation(id) {
        this.animations.client_remove(id);
    }
    server_moveAnimation(client, id, newIndex, callback) {
        this.animations.move(id, newIndex, (err, actualIndex) => {
            if (err != null) {
                callback(err);
                return;
            }
            callback(null, null, id, actualIndex);
            this.emit("change");
        });
    }
    client_moveAnimation(id, newIndex) {
        this.animations.client_move(id, newIndex);
    }
    server_setAnimationProperty(client, id, key, value, callback) {
        if (key === "name") {
            if (typeof value !== "string") {
                callback("Invalid value");
                return;
            }
            value = value.trim();
            if (SupCore.Data.hasDuplicateName(id, value, this.animations.pub)) {
                callback("There's already an animation with this name");
                return;
            }
        }
        this.animations.setProperty(id, key, value, (err, actualValue) => {
            if (err != null) {
                callback(err);
                return;
            }
            callback(null, null, id, key, actualValue);
            this.emit("change");
        });
    }
    client_setAnimationProperty(id, key, actualValue) {
        this.animations.client_setProperty(id, key, actualValue);
    }
    server_setAnimation(client, id, duration, keyFrames, callback) {
        let violation = SupCore.Data.Base.getRuleViolation(duration, ModelAnimations_1.default.schema["duration"], true);
        if (violation != null) {
            callback(`Invalid duration: ${SupCore.Data.Base.formatRuleViolation(violation)}`);
            return;
        }
        violation = SupCore.Data.Base.getRuleViolation(keyFrames, ModelAnimations_1.default.schema["keyFrames"], true);
        if (violation != null) {
            callback(`Invalid duration: ${SupCore.Data.Base.formatRuleViolation(violation)}`);
            return;
        }
        const animation = this.animations.byId[id];
        if (animation == null) {
            callback(`Invalid animation id: ${id}`);
            return;
        }
        animation.duration = duration;
        animation.keyFrames = keyFrames;
        callback(null, null, id, duration, keyFrames);
        this.emit("change");
    }
    client_setAnimation(id, duration, keyFrames) {
        const animation = this.animations.byId[id];
        animation.duration = duration;
        animation.keyFrames = keyFrames;
    }
}
ModelAsset.currentFormatVersion = 2;
ModelAsset.schema = {
    formatVersion: { type: "integer" },
    unitRatio: { type: "number", minExcluded: 0, mutable: true },
    upAxisMatrix: { type: "array", length: 16, items: { type: "number" } },
    attributes: {
        type: "hash",
        properties: {
            position: { type: "buffer?", mutable: true },
            index: { type: "buffer?", mutable: true },
            color: { type: "buffer?", mutable: true },
            uv: { type: "buffer?", mutable: true },
            normal: { type: "buffer?", mutable: true },
            skinIndex: { type: "buffer?", mutable: true },
            skinWeight: { type: "buffer?", mutable: true }
        }
    },
    bones: {
        type: "array",
        items: {
            type: "hash",
            properties: {
                name: { type: "string", minLength: 1, maxLength: 80 },
                parentIndex: { type: "integer?" },
                matrix: { type: "array", length: 16, items: { type: "number" } }
            }
        }
    },
    // TODO: Material
    maps: {
        type: "hash",
        values: { type: "buffer?" }
    },
    filtering: { type: "enum", items: ["pixelated", "smooth"], mutable: true },
    wrapping: { type: "enum", items: ["clampToEdge", "repeat", "mirroredRepeat"], mutable: true },
    animations: { type: "array" },
    opacity: { type: "number?", min: 0, max: 1, mutable: true },
    mapSlots: {
        type: "hash",
        properties: {
            map: { type: "string?", mutable: true },
            light: { type: "string?", mutable: true },
            specular: { type: "string?", mutable: true },
            alpha: { type: "string?", mutable: true },
            normal: { type: "string?", mutable: true }
        }
    }
};
exports.default = ModelAsset;
