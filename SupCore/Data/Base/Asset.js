"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Hash_1 = require("./Hash");
const path = require("path");
const fs = require("fs");
class Asset extends Hash_1.default {
    constructor(id, pub, schema, server) {
        super(pub, schema);
        this.id = id;
        this.server = server;
        this.setMaxListeners(Infinity);
        if (this.server == null)
            this.setup();
    }
    init(options, callback) { this.setup(); callback(); }
    setup() { }
    restore() { }
    onClientUnsubscribed(clientId) { }
    destroy(callback) { callback(); }
    load(assetPath) {
        fs.readFile(path.join(assetPath, "asset.json"), { encoding: "utf8" }, (err, json) => {
            if (err != null)
                throw err;
            const pub = JSON.parse(json);
            this._onLoaded(assetPath, pub);
        });
    }
    _onLoaded(assetPath, pub) {
        this.migrate(assetPath, pub, (hasMigrated) => {
            if (hasMigrated) {
                this.pub = pub;
                this.save(assetPath, (err) => {
                    this.setup();
                    this.emit("load");
                });
            }
            else {
                this.pub = pub;
                this.setup();
                this.emit("load");
            }
        });
    }
    unload() { this.removeAllListeners(); }
    migrate(assetPath, pub, callback) { callback(false); }
    client_load() { }
    client_unload() { }
    save(assetPath, callback) {
        const json = JSON.stringify(this.pub, null, 2);
        fs.writeFile(path.join(assetPath, "asset.json"), json, { encoding: "utf8" }, callback);
    }
    server_setProperty(client, path, value, callback) {
        this.setProperty(path, value, (err, actualValue) => {
            if (err != null) {
                callback(err);
                return;
            }
            callback(null, null, path, actualValue);
        });
    }
}
exports.default = Asset;
