"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BaseRemoteClient_1 = require("./BaseRemoteClient");
const config_1 = require("./config");
const path = require("path");
const fs = require("fs");
const rimraf = require("rimraf");
const async = require("async");
const recursiveReaddir = require("recursive-readdir");
class RemoteProjectClient extends BaseRemoteClient_1.default {
    constructor(server, id, socket) {
        super(server, socket);
        // Manifest
        this.onSetManifestProperty = (key, value, callback) => {
            this.server.data.manifest.setProperty(key, value, (err, actualValue) => {
                if (err != null) {
                    callback(err, null);
                    return;
                }
                this.server.io.in("sub:manifest").emit("setProperty:manifest", key, actualValue);
                callback(null, actualValue);
            });
        };
        // Entries
        this.onAddEntry = (name, type, options, callback) => {
            this.server.addEntry(this.socket.id, name, type, options, callback);
        };
        this.onDuplicateEntry = (newName, originalEntryId, options, callback) => {
            this.server.duplicateEntry(this.socket.id, newName, originalEntryId, options, callback);
        };
        this.onMoveEntry = (id, parentId, index, callback) => {
            this.server.moveEntry(this.socket.id, id, parentId, index, callback);
        };
        this.onTrashEntry = (entryId, callback) => {
            this.server.trashEntry(this.socket.id, entryId, callback);
        };
        this.onSetEntryProperty = (entryId, key, value, callback) => {
            if (key === "name") {
                this.server.renameEntry(this.socket.id, entryId, value, callback);
                return;
            }
            if (!this.errorIfCant("editAssets", callback))
                return;
            if (value.indexOf("/") !== -1) {
                callback("Entry name cannot contain slashes");
                return;
            }
            this.server.data.entries.setProperty(entryId, key, value, (err, actualValue) => {
                if (err != null) {
                    callback(err);
                    return;
                }
                this.server.io.in("sub:entries").emit("setProperty:entries", entryId, key, actualValue);
                callback(null);
            });
        };
        this.onSaveEntry = (entryId, revisionName, callback) => {
            this.server.saveEntry(this.socket.id, entryId, revisionName, callback);
        };
        // Assets
        this.onEditAsset = (id, command, ...args) => {
            let callback = null;
            if (typeof args[args.length - 1] === "function")
                callback = args.pop();
            if (!this.errorIfCant("editAssets", callback))
                return;
            const entry = this.server.data.entries.byId[id];
            if (entry == null || entry.type == null) {
                callback("No such asset");
                return;
            }
            if (command == null) {
                callback("Invalid command");
                return;
            }
            const commandMethod = this.server.system.data.assetClasses[entry.type].prototype[`server_${command}`];
            if (commandMethod == null) {
                callback("Invalid command");
                return;
            }
            // if (callback == null) { this.server.log("Ignoring edit:assets command, missing a callback"); return; }
            this.server.data.assets.acquire(id, null, (err, asset) => {
                if (err != null) {
                    callback("Could not acquire asset");
                    return;
                }
                commandMethod.call(asset, this, ...args, (err, ack, ...callbackArgs) => {
                    this.server.data.assets.release(id, null);
                    if (err != null) {
                        callback(err);
                        return;
                    }
                    this.server.io.in(`sub:assets:${id}`).emit("edit:assets", id, command, ...callbackArgs);
                    callback(null, ack);
                });
            });
        };
        this.onRestoreAsset = (assetId, revisionId, callback) => {
            const entry = this.server.data.entries.byId[assetId];
            if (entry == null || entry.type == null) {
                callback("No such asset");
                return;
            }
            const assetClass = this.server.system.data.assetClasses[entry.type];
            const newAsset = new assetClass(assetId, null, this.server);
            const revisionName = this.server.data.entries.revisionsByEntryId[assetId][revisionId];
            const revisionPath = `assetRevisions/${assetId}/${revisionId}-${revisionName}`;
            newAsset.load(path.join(this.server.projectPath, revisionPath));
            newAsset.on("load", () => {
                this.server.data.assets.acquire(assetId, null, (err, asset) => {
                    if (err != null) {
                        callback("Could not acquire asset");
                        return;
                    }
                    this.server.data.assets.release(assetId, null);
                    for (const badge of entry.badges)
                        asset.emit("clearBadge", badge.id);
                    entry.badges.length = 0;
                    asset.pub = newAsset.pub;
                    asset.setup();
                    asset.restore();
                    asset.emit("change");
                    this.server.io.in(`sub:assets:${assetId}`).emit("restore:assets", assetId, entry.type, asset.pub);
                    callback(null);
                });
            });
        };
        this.onGetAssetRevision = (assetId, revisionId, callback) => {
            const entry = this.server.data.entries.byId[assetId];
            if (entry == null || entry.type == null) {
                callback("No such asset");
                return;
            }
            const assetClass = this.server.system.data.assetClasses[entry.type];
            const revisionAsset = new assetClass(assetId, null, this.server);
            const revisionName = this.server.data.entries.revisionsByEntryId[assetId][revisionId];
            const revisionPath = `assetRevisions/${assetId}/${revisionId}-${revisionName}`;
            revisionAsset.load(path.join(this.server.projectPath, revisionPath));
            revisionAsset.on("load", () => { callback(null, revisionAsset.pub); });
        };
        // Resources
        this.onEditResource = (id, command, ...args) => {
            let callback = null;
            if (typeof args[args.length - 1] === "function")
                callback = args.pop();
            if (!this.errorIfCant("editResources", callback))
                return;
            if (command == null) {
                callback("Invalid command");
                return;
            }
            const commandMethod = this.server.system.data.resourceClasses[id].prototype[`server_${command}`];
            if (commandMethod == null) {
                callback("Invalid command");
                return;
            }
            // if (callback == null) { this.server.log("Ignoring edit:assets command, missing a callback"); return; }
            this.server.data.resources.acquire(id, null, (err, resource) => {
                if (err != null) {
                    callback("Could not acquire resource");
                    return;
                }
                commandMethod.call(resource, this, ...args, (err, ack, ...callbackArgs) => {
                    this.server.data.resources.release(id, null);
                    if (err != null) {
                        callback(err);
                        return;
                    }
                    this.server.io.in(`sub:resources:${id}`).emit("edit:resources", id, command, ...callbackArgs);
                    callback(null, ack);
                });
            });
        };
        // Rooms
        this.onEditRoom = (id, command, ...args) => {
            let callback = null;
            if (typeof args[args.length - 1] === "function")
                callback = args.pop();
            if (!this.errorIfCant("editRooms", callback))
                return;
            if (command == null) {
                callback("Invalid command");
                return;
            }
            const commandMethod = SupCore.Data.Room.prototype[`server_${command}`];
            if (commandMethod == null) {
                callback("Invalid command");
                return;
            }
            // if (callback == null) { this.server.log("Ignoring edit:rooms command, missing a callback"); return; }
            this.server.data.rooms.acquire(id, null, (err, room) => {
                if (err != null) {
                    callback("Could not acquire room");
                    return;
                }
                commandMethod.call(room, this, ...args, (err, ...callbackArgs) => {
                    this.server.data.rooms.release(id, null);
                    if (err != null) {
                        callback(err);
                        return;
                    }
                    this.server.io.in(`sub:rooms:${id}`).emit("edit:rooms", id, command, ...callbackArgs);
                    callback(null, (callbackArgs[0] != null) ? callbackArgs[0].id : null);
                });
            });
        };
        // Project
        this.onVacuumProject = (callback) => {
            if (!this.errorIfCant("vacuumProject", callback))
                return;
            const trashedAssetsPath = path.join(this.server.projectPath, "trashedAssets");
            fs.readdir(trashedAssetsPath, (err, trashedAssetFolders) => {
                if (err != null) {
                    if (err.code === "ENOENT")
                        trashedAssetFolders = [];
                    else
                        throw err;
                }
                let removedFolderCount = 0;
                async.each(trashedAssetFolders, (trashedAssetFolder, cb) => {
                    const folderPath = path.join(trashedAssetsPath, trashedAssetFolder);
                    rimraf(folderPath, (err) => {
                        if (err != null)
                            SupCore.log(`Could not delete ${folderPath}.\n${err.stack}`);
                        else
                            removedFolderCount++;
                        cb();
                    });
                }, () => { callback(null, removedFolderCount); });
            });
        };
        this.onBuildProject = (callback) => {
            if (!this.errorIfCant("buildProject", callback))
                return;
            // this.server.log("Building project...");
            const buildId = this.server.nextBuildId;
            this.server.nextBuildId++;
            const buildPath = `${this.server.buildsPath}/${buildId}`;
            try {
                fs.mkdirSync(this.server.buildsPath);
            }
            catch (e) { /* Ignore */ }
            try {
                fs.mkdirSync(buildPath);
            }
            catch (err) {
                callback(`Could not create folder for build ${buildId}`);
                return;
            }
            this.server.system.serverBuild(this.server, buildPath, (err) => {
                if (err != null) {
                    callback(`Failed to create build ${buildId}: ${err}`);
                    return;
                }
                // Collect paths to all build files
                let files = [];
                recursiveReaddir(buildPath, (err, entries) => {
                    for (const entry of entries) {
                        let relativePath = path.relative(buildPath, entry);
                        if (path.sep === "\\")
                            relativePath = relativePath.replace(/\\/g, "/");
                        files.push(`/builds/${this.server.data.manifest.pub.id}/${buildId}/${relativePath}`);
                    }
                    callback(null, buildId.toString());
                    // Remove an old build to avoid using too much disk space
                    const buildToDeleteId = buildId - config_1.server.maxRecentBuilds;
                    const buildToDeletePath = `${this.server.buildsPath}/${buildToDeleteId}`;
                    rimraf(buildToDeletePath, (err) => {
                        if (err != null) {
                            this.server.log(`Failed to remove build ${buildToDeleteId}:`);
                            this.server.log(err.toString());
                        }
                    });
                });
            });
        };
        this.id = id;
        this.socket.emit("welcome", this.id, {
            systemId: this.server.system.id,
            buildPort: config_1.server.buildPort,
            supportsServerBuild: this.server.system.serverBuild != null
        });
        // Manifest
        this.socket.on("setProperty:manifest", this.onSetManifestProperty);
        // Entries
        this.socket.on("add:entries", this.onAddEntry);
        this.socket.on("duplicate:entries", this.onDuplicateEntry);
        this.socket.on("move:entries", this.onMoveEntry);
        this.socket.on("trash:entries", this.onTrashEntry);
        this.socket.on("setProperty:entries", this.onSetEntryProperty);
        this.socket.on("save:entries", this.onSaveEntry);
        // Assets
        this.socket.on("edit:assets", this.onEditAsset);
        this.socket.on("restore:assets", this.onRestoreAsset);
        this.socket.on("getRevision:assets", this.onGetAssetRevision);
        // Resources
        this.socket.on("edit:resources", this.onEditResource);
        // Rooms
        this.socket.on("edit:rooms", this.onEditRoom);
        // Project
        this.socket.on("vacuum:project", this.onVacuumProject);
        this.socket.on("build:project", this.onBuildProject);
    }
    // TODO: Implement roles and capabilities
    can(action) { return true; }
}
exports.default = RemoteProjectClient;
