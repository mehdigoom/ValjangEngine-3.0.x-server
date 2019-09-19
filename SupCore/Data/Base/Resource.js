"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Hash_1 = require("./Hash");
const path = require("path");
const fs = require("fs");
class Resource extends Hash_1.default {
    constructor(id, pub, schema, server) {
        super(pub, schema);
        this.id = id;
        this.server = server;
        if (server == null)
            this.setup();
    }
    init(callback) { this.setup(); callback(); }
    setup() { }
    restore() { }
    load(resourcePath) {
        fs.readFile(path.join(resourcePath, "resource.json"), { encoding: "utf8" }, (err, json) => {
            if (err != null) {
                if (err.code === "ENOENT") {
                    this.init(() => { this._onLoaded(resourcePath, this.pub, true); });
                    return;
                }
                throw err;
            }
            const pub = JSON.parse(json);
            this._onLoaded(resourcePath, pub, false);
        });
    }
    _onLoaded(resourcePath, pub, justCreated) {
        if (justCreated) {
            this.pub = pub;
            fs.mkdir(path.join(resourcePath), (err) => {
                this.save(resourcePath, (err) => {
                    this.setup();
                    this.emit("load");
                });
            });
            return;
        }
        this.migrate(resourcePath, pub, (hasMigrated) => {
            if (hasMigrated) {
                this.pub = pub;
                fs.mkdir(path.join(resourcePath), (err) => {
                    this.save(resourcePath, (err) => {
                        this.setup();
                        this.emit("load");
                    });
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
    migrate(resourcePath, pub, callback) { callback(false); }
    save(resourcePath, callback) {
        const json = JSON.stringify(this.pub, null, 2);
        fs.writeFile(path.join(resourcePath, "resource.json"), json, { encoding: "utf8" }, callback);
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
exports.default = Resource;
