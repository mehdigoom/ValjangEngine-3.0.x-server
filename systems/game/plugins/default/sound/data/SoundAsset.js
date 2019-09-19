"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs");
class SoundAsset extends SupCore.Data.Base.Asset {
    constructor(id, pub, server) {
        super(id, pub, SoundAsset.schema, server);
    }
    init(options, callback) {
        this.pub = { formatVersion: SoundAsset.currentFormatVersion, sound: new Buffer(0), streaming: false };
        super.init(options, callback);
    }
    load(assetPath) {
        let pub;
        fs.readFile(path.join(assetPath, "sound.json"), { encoding: "utf8" }, (err, json) => {
            // NOTE: "asset.json" was renamed to "sound.json" in Superpowers 0.11
            if (err != null && err.code === "ENOENT") {
                fs.readFile(path.join(assetPath, "asset.json"), { encoding: "utf8" }, (err, json) => {
                    fs.rename(path.join(assetPath, "asset.json"), path.join(assetPath, "sound.json"), (err) => {
                        pub = JSON.parse(json);
                        fs.readFile(path.join(assetPath, "sound.dat"), (err, buffer) => {
                            pub.sound = buffer;
                            this._onLoaded(assetPath, pub);
                        });
                    });
                });
            }
            else {
                pub = JSON.parse(json);
                fs.readFile(path.join(assetPath, "sound.dat"), (err, buffer) => {
                    pub.sound = buffer;
                    this._onLoaded(assetPath, pub);
                });
            }
        });
    }
    migrate(assetPath, pub, callback) {
        if (pub.formatVersion === SoundAsset.currentFormatVersion) {
            callback(false);
            return;
        }
        if (pub.formatVersion == null) {
            if (pub.streaming == null)
                pub.streaming = false;
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
    write(writeFile, assetPath, callback) {
        let buffer = this.pub.sound;
        delete this.pub.sound;
        const json = JSON.stringify(this.pub, null, 2);
        this.pub.sound = buffer;
        if (buffer instanceof ArrayBuffer)
            buffer = new Buffer(buffer);
        writeFile(path.join(assetPath, "sound.json"), json, { encoding: "utf8" }, () => {
            writeFile(path.join(assetPath, "sound.dat"), buffer, callback);
        });
    }
    server_upload(client, sound, callback) {
        if (!(sound instanceof Buffer)) {
            callback("Sound must be an ArrayBuffer");
            return;
        }
        this.pub.sound = sound;
        callback(null, null, sound);
        this.emit("change");
    }
    client_upload(sound) {
        this.pub.sound = sound;
    }
}
SoundAsset.currentFormatVersion = 1;
SoundAsset.schema = {
    formatVersion: { type: "integer" },
    sound: { type: "buffer" },
    streaming: { type: "boolean", mutable: true }
};
exports.default = SoundAsset;
