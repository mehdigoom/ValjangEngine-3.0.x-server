"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const mkdirp = require("mkdirp");
const path = require("path");
const async = require("async");
const RemoteProjectClient_1 = require("./RemoteProjectClient");
const schemas = require("./schemas");
const migrateProject_1 = require("./migrateProject");
const saveDelay = 60;
class ProjectServer {
    constructor(globalIO, projectPath, buildsPath, callback) {
        this.projectPath = projectPath;
        this.scheduledSaveCallbacks = {};
        this.nextClientId = 0;
        this.clientsBySocketId = {};
        this.scheduleAssetSave = (id) => {
            const item = this.data.assets.byId[id];
            if (item == null) {
                SupCore.log(`Tried to schedule an asset save for item with id ${id} but the asset is not loaded.`);
                SupCore.log(JSON.stringify(this.data.entries.byId[id], null, 2));
                SupCore.log(new Error().stack);
                return;
            }
            const assetPath = path.join(this.projectPath, `assets/${this.data.entries.getStoragePathFromId(id)}`);
            const saveCallback = item.save.bind(item, assetPath);
            this.scheduleSave(saveDelay, `assets:${id}`, saveCallback);
        };
        this.onAssetLoaded = (assetId, item) => {
            item.on("change", () => { this.scheduleAssetSave(assetId); });
            item.on("edit", (commandName, ...args) => { this.io.in(`sub:assets:${assetId}`).emit("edit:assets", assetId, commandName, ...args); });
            item.on("setBadge", (badgeId, type, data) => { this.setBadge(assetId, badgeId, type, data); });
            item.on("clearBadge", (badgeId) => { this.clearBadge(assetId, badgeId); });
            item.on("addDependencies", (dependencyEntryIds) => { this.addDependencies(assetId, dependencyEntryIds); });
            item.on("removeDependencies", (dependencyEntryIds) => { this.removeDependencies(assetId, dependencyEntryIds); });
        };
        this.onRoomLoaded = (roomId, item) => {
            const roomPath = path.join(this.projectPath, `rooms/${roomId}`);
            const saveCallback = item.save.bind(item, roomPath);
            item.on("change", () => { this.scheduleSave(saveDelay, `rooms:${roomId}`, saveCallback); });
        };
        this.onResourceLoaded = (resourceId, item) => {
            const resourcePath = path.join(this.projectPath, `resources/${resourceId}`);
            const saveCallback = item.save.bind(item, resourcePath);
            item.on("change", () => { this.scheduleSave(saveDelay, `resources:${resourceId}`, saveCallback); });
            item.on("edit", (commandName, ...args) => { this.io.in(`sub:resources:${resourceId}`).emit("edit:resources", resourceId, commandName, ...args); });
            item.on("setAssetBadge", (assetId, badgeId, type, data) => { this.setBadge(assetId, badgeId, type, data); });
            item.on("clearAssetBadge", (assetId, badgeId) => { this.clearBadge(assetId, badgeId); });
        };
        this.onAddSocket = (socket) => {
            const client = new RemoteProjectClient_1.default(this, (this.nextClientId++).toString(), socket);
            this.clientsBySocketId[socket.id] = client;
        };
        this.scheduleSave = (minimumSecondsElapsed, callbackName, callback) => {
            // this.log(`Scheduling a save: ${callbackName}`);
            const scheduledCallback = this.scheduledSaveCallbacks[callbackName];
            if (scheduledCallback != null && scheduledCallback.timeoutId != null)
                return;
            const errorCallback = (err) => {
                // this.log(`Save done! ${callbackName}`);
                if (err != null)
                    this.log(`Error in ${callbackName}:\n${err}`);
            };
            if (scheduledCallback == null || scheduledCallback.lastTime <= Date.now() - minimumSecondsElapsed * 1000) {
                this.scheduledSaveCallbacks[callbackName] = { lastTime: Date.now(), timeoutId: null, callback: null };
                callback(errorCallback);
            }
            else {
                const delay = minimumSecondsElapsed * 1000 - (Date.now() - scheduledCallback.lastTime);
                const timeoutId = setTimeout(() => {
                    callback(errorCallback);
                    scheduledCallback.lastTime = Date.now();
                    scheduledCallback.timeoutId = null;
                    scheduledCallback.callback = null;
                }, delay);
                scheduledCallback.timeoutId = timeoutId;
                scheduledCallback.callback = callback;
            }
        };
        this.onManifestChanged = () => { this.scheduleSave(saveDelay, "manifest", this.saveManifest); };
        this.onEntriesChanged = () => { this.scheduleSave(saveDelay, "entries", this.saveEntries); };
        this.saveManifest = (callback) => {
            const manifestJSON = JSON.stringify(this.data.manifest.pub, null, 2);
            fs.writeFile(path.join(this.projectPath, "manifest.json"), manifestJSON, callback);
        };
        this.saveEntries = (callback) => {
            const entriesJSON = JSON.stringify({ nextEntryId: this.data.entries.nextId, nodes: this.data.entries.getForStorage() }, null, 2);
            fs.writeFile(path.join(this.projectPath, "newEntries.json"), entriesJSON, () => {
                fs.rename(path.join(this.projectPath, "newEntries.json"), path.join(this.projectPath, "entries.json"), callback);
            });
        };
        this.addEntry = (clientSocketId, name, type, options, callback) => {
            if (!this.clientsBySocketId[clientSocketId].errorIfCant("editAssets", callback))
                return;
            name = name.trim();
            if (name.length === 0) {
                callback("Entry name cannot be empty");
                return;
            }
            if (name.indexOf("/") !== -1) {
                callback("Entry name cannot contain slashes");
                return;
            }
            const entry = { id: null, name, type, badges: [], dependentAssetIds: [] };
            if (options == null)
                options = {};
            this.data.entries.add(entry, options.parentId, options.index, (err, actualIndex) => {
                if (err != null) {
                    callback(err, null);
                    return;
                }
                const onEntryCreated = () => {
                    this.io.in("sub:entries").emit("add:entries", entry, options.parentId, actualIndex);
                    callback(null, entry.id);
                };
                if (entry.type != null) {
                    const assetClass = this.system.data.assetClasses[entry.type];
                    const asset = new assetClass(entry.id, null, this);
                    asset.init({ name: entry.name }, () => {
                        const assetPath = path.join(this.projectPath, `assets/${this.data.entries.getStoragePathFromId(entry.id)}`);
                        mkdirp(assetPath, () => { asset.save(assetPath, onEntryCreated); });
                    });
                }
                else {
                    onEntryCreated();
                }
            });
        };
        this.duplicateEntry = (clientSocketId, newName, originalEntryId, options, callback) => {
            if (!this.clientsBySocketId[clientSocketId].errorIfCant("editAssets", callback))
                return;
            const entryToDuplicate = this.data.entries.byId[originalEntryId];
            if (entryToDuplicate == null) {
                callback(`Entry ${originalEntryId} doesn't exist`);
                return;
            }
            const entry = {
                id: null, name: newName, type: entryToDuplicate.type,
                badges: [], dependentAssetIds: []
            };
            if (options == null)
                options = {};
            if (entryToDuplicate.type == null) {
                this.data.entries.add(entry, options.parentId, options.index, (err, actualIndex) => {
                    if (err != null) {
                        callback(err, null);
                        return;
                    }
                    this.io.in("sub:entries").emit("add:entries", entry, options.parentId, actualIndex);
                    async.eachSeries(entryToDuplicate.children, (child, cb) => {
                        this.duplicateEntry(clientSocketId, child.name, child.id, { parentId: entry.id, index: entryToDuplicate.children.indexOf(child) }, (err, duplicatedId) => {
                            if (err == null)
                                cb(null);
                            else
                                cb(new Error(err));
                        });
                    }, (err) => {
                        if (err != null)
                            callback(err.message, null);
                        else
                            callback(null, entry.id);
                    });
                });
            }
            else {
                this.data.entries.add(entry, options.parentId, options.index, (err, actualIndex) => {
                    if (err != null) {
                        callback(err);
                        return;
                    }
                    const newAssetPath = path.join(this.projectPath, `assets/${this.data.entries.getStoragePathFromId(entry.id)}`);
                    this.data.assets.acquire(originalEntryId, null, (err, referenceAsset) => {
                        mkdirp(newAssetPath, () => {
                            referenceAsset.save(newAssetPath, (err) => {
                                this.data.assets.release(originalEntryId, null);
                                if (err != null) {
                                    this.log(`Failed to save duplicated asset at ${newAssetPath} (duplicating ${originalEntryId})`);
                                    this.log(err.toString());
                                    this.data.entries.remove(entry.id, (err) => { if (err != null)
                                        this.log(err); });
                                    callback("Could not save asset");
                                    return;
                                }
                                this.data.assets.acquire(entry.id, null, (err, newAsset) => {
                                    this.data.assets.release(entry.id, null);
                                    this.io.in("sub:entries").emit("add:entries", entry, options.parentId, actualIndex);
                                    newAsset.restore();
                                    callback(null, entry.id);
                                });
                            });
                        });
                    });
                });
            }
        };
        this.moveEntry = (clientSocketId, entryId, parentId, index, callback) => {
            if (!this.clientsBySocketId[clientSocketId].errorIfCant("editAssets", callback))
                return;
            const oldFullAssetPath = this.data.entries.getStoragePathFromId(entryId);
            const oldParent = this.data.entries.parentNodesById[entryId];
            this.data.entries.move(entryId, parentId, index, (err, actualIndex) => {
                if (err != null) {
                    callback(err);
                    return;
                }
                this.onEntryChangeFullPath(entryId, oldFullAssetPath, () => {
                    if (oldParent == null || oldParent.children.length > 0)
                        return;
                    const oldParentPath = path.join(this.projectPath, `assets/${this.data.entries.getStoragePathFromId(oldParent.id)}`);
                    fs.readdir(oldParentPath, (err, files) => { if (files != null && files.length === 0)
                        fs.rmdirSync(oldParentPath); });
                });
                this.io.in("sub:entries").emit("move:entries", entryId, parentId, actualIndex);
                callback(null);
            });
        };
        this.trashEntry = (clientSocketId, entryId, callback) => {
            if (!this.clientsBySocketId[clientSocketId].errorIfCant("editAssets", callback))
                return;
            const trashEntryRecursively = (entry, callback) => {
                const finishTrashEntry = (err) => {
                    if (err != null) {
                        callback(err);
                        return;
                    }
                    // Clear all dependencies for this entry
                    const dependentAssetIds = (entry != null) ? entry.dependentAssetIds : null;
                    const dependencies = this.data.entries.dependenciesByAssetId[entry.id];
                    if (dependencies != null) {
                        const removedDependencyEntryIds = [];
                        for (const depId of dependencies) {
                            const depEntry = this.data.entries.byId[depId];
                            if (depEntry == null)
                                continue;
                            const dependentAssetIds = depEntry.dependentAssetIds;
                            const index = dependentAssetIds.indexOf(entry.id);
                            if (index !== -1) {
                                dependentAssetIds.splice(index, 1);
                                removedDependencyEntryIds.push(depId);
                            }
                        }
                        if (removedDependencyEntryIds.length > 0) {
                            this.io.in("sub:entries").emit("remove:dependencies", entry.id, dependencies);
                        }
                        delete this.data.entries.dependenciesByAssetId[entry.id];
                    }
                    let asset;
                    async.series([
                        (cb) => {
                            if (entry.type != null) {
                                this.data.assets.acquire(entry.id, null, (err, acquiredAsset) => {
                                    if (err != null) {
                                        cb(err);
                                        return;
                                    }
                                    asset = acquiredAsset;
                                    cb(null);
                                });
                            }
                            else
                                cb(null);
                        }, (cb) => {
                            // Apply and clear any scheduled saved
                            const scheduledSaveCallback = this.scheduledSaveCallbacks[`assets:${entry.id}`];
                            if (scheduledSaveCallback == null) {
                                cb();
                                return;
                            }
                            if (scheduledSaveCallback.timeoutId != null)
                                clearTimeout(scheduledSaveCallback.timeoutId);
                            delete this.scheduledSaveCallbacks[`assets:${entry.id}`];
                            const assetPath = path.join(this.projectPath, `assets/${this.data.entries.getStoragePathFromId(entry.id)}`);
                            asset.save(assetPath, cb);
                        }, (cb) => {
                            // Delete the entry
                            this.data.entries.remove(entry.id, (err) => {
                                if (err != null) {
                                    cb(new Error(err));
                                    return;
                                }
                                this.io.in("sub:entries").emit("trash:entries", entry.id);
                                // Notify and clear all asset subscribers
                                const roomName = `sub:assets:${entry.id}`;
                                this.io.in(roomName).emit("trash:assets", entry.id);
                                const room = this.io.adapter.rooms[roomName]; // room is null when the asset isn't open in any client
                                if (room != null) {
                                    for (const socketId in room.sockets) {
                                        const remoteClient = this.clientsBySocketId[socketId];
                                        remoteClient.socket.leave(roomName);
                                        remoteClient.subscriptions.splice(remoteClient.subscriptions.indexOf(roomName), 1);
                                    }
                                }
                                // Generate badges for any assets depending on this entry
                                if (dependentAssetIds != null)
                                    this.markMissingDependency(dependentAssetIds, entryId);
                                // Skip asset destruction & release if trashing a folder
                                if (asset == null) {
                                    cb(null);
                                    return;
                                }
                                // NOTE: It is important that we destroy the asset after having removed its entry
                                // from the tree so that nobody can subscribe to it after it's been destroyed
                                asset.destroy(() => {
                                    this.data.assets.releaseAll(entry.id);
                                    cb(null);
                                });
                            });
                        }
                    ], callback);
                };
                if (entry.type == null) {
                    async.each(entry.children, (entry, cb) => { trashEntryRecursively(entry, cb); }, finishTrashEntry);
                }
                else
                    finishTrashEntry(null);
            };
            const trashedAssetFolder = this.data.entries.getStoragePathFromId(entryId);
            const entry = this.data.entries.byId[entryId];
            const gotChildren = entry.type == null && entry.children.length > 0;
            const parentEntry = this.data.entries.parentNodesById[entryId];
            trashEntryRecursively(entry, (err) => {
                if (err != null) {
                    callback(err.message);
                    return;
                }
                // After the trash on memory, move folder to trashed assets and clean up empty folders
                const deleteFolder = (folderPath, callback) => {
                    fs.readdir(folderPath, (err, files) => {
                        if (err != null) {
                            if (err.code !== "ENOENT")
                                callback(err.message);
                            else
                                callback(null);
                            return;
                        }
                        if (files.length === 0) {
                            fs.rmdir(folderPath, (err) => {
                                if (err != null) {
                                    callback(err.message);
                                    return;
                                }
                                callback(null);
                            });
                        }
                        else
                            callback(null);
                    });
                };
                if (entry.type != null || gotChildren) {
                    this.moveAssetFolderToTrash(trashedAssetFolder, (err) => {
                        if (err != null) {
                            callback(err.message);
                            return;
                        }
                        if (parentEntry != null && parentEntry.children.length === 0)
                            deleteFolder(path.join(this.projectPath, "assets", this.data.entries.getStoragePathFromId(parentEntry.id)), callback);
                        else
                            callback(null);
                    });
                }
                else
                    deleteFolder(path.join(this.projectPath, "assets", trashedAssetFolder), callback);
            });
        };
        this.renameEntry = (clientSocketId, entryId, name, callback) => {
            if (!this.clientsBySocketId[clientSocketId].errorIfCant("editAssets", callback))
                return;
            if (name.indexOf("/") !== -1) {
                callback("Entry name cannot contain slashes");
                return;
            }
            const oldFullAssetPath = this.data.entries.getStoragePathFromId(entryId);
            this.data.entries.setProperty(entryId, "name", name, (err, actualName) => {
                if (err != null) {
                    callback(err);
                    return;
                }
                this.onEntryChangeFullPath(entryId, oldFullAssetPath);
                this.io.in("sub:entries").emit("setProperty:entries", entryId, "name", actualName);
                callback(null);
            });
        };
        this.onEntryChangeFullPath = (assetId, oldFullAssetPath, callback) => {
            let mustScheduleSave = false;
            const scheduledSaveCallback = this.scheduledSaveCallbacks[`assets:${assetId}`];
            if (scheduledSaveCallback != null && scheduledSaveCallback.timeoutId != null) {
                clearTimeout(scheduledSaveCallback.timeoutId);
                scheduledSaveCallback.timeoutId = null;
                scheduledSaveCallback.callback = null;
                mustScheduleSave = true;
            }
            const assetPath = this.data.entries.getStoragePathFromId(assetId);
            async.series([
                (cb) => {
                    const index = assetPath.lastIndexOf("/");
                    if (index !== -1) {
                        const parentPath = assetPath.slice(0, index);
                        mkdirp(path.join(this.projectPath, `assets/${parentPath}`), cb);
                    }
                    else
                        cb(null);
                }, (cb) => {
                    const oldDirPath = path.join(this.projectPath, `assets/${oldFullAssetPath}`);
                    const dirPath = path.join(this.projectPath, `assets/${assetPath}`);
                    fs.rename(oldDirPath, dirPath, (err) => {
                        if (mustScheduleSave)
                            this.scheduleAssetSave(assetId);
                        if (callback != null)
                            callback();
                    });
                }
            ]);
        };
        this.saveEntry = (clientSocketId, entryId, revisionName, callback) => {
            if (!this.clientsBySocketId[clientSocketId].errorIfCant("editAssets", callback))
                return;
            if (revisionName.length === 0) {
                callback("Revision name can't be empty");
                return;
            }
            this.data.entries.save(entryId, revisionName, (err, revisionId) => {
                if (err != null) {
                    callback(err);
                    return;
                }
                this.data.assets.acquire(entryId, null, (err, asset) => {
                    if (err != null) {
                        callback("Could not acquire asset");
                        return;
                    }
                    this.data.assets.release(entryId, null);
                    const revisionPath = path.join(this.projectPath, `assetRevisions/${entryId}/${revisionId}-${revisionName}`);
                    mkdirp(revisionPath, (err) => {
                        if (err != null) {
                            callback("Could not write the save");
                            return;
                        }
                        asset.save(revisionPath, (err) => {
                            if (err != null) {
                                callback("Could not write the save");
                                console.log(err);
                                return;
                            }
                            this.io.in("sub:entries").emit("save:entries", entryId, revisionId, revisionName);
                            callback(null);
                        });
                    });
                });
            });
        };
        this.data = {
            manifest: null,
            entries: null,
            assets: new SupCore.Data.Assets(this),
            rooms: new SupCore.Data.Rooms(this),
            resources: new SupCore.Data.Resources(this)
        };
        this.data.assets.on("itemLoad", this.onAssetLoaded);
        this.data.rooms.on("itemLoad", this.onRoomLoaded);
        this.data.resources.on("itemLoad", this.onResourceLoaded);
        const loadManifest = (callback) => {
            const done = (data) => {
                try {
                    this.data.manifest = new SupCore.Data.ProjectManifest(data);
                }
                catch (err) {
                    callback(err);
                    return;
                }
                this.data.manifest.on("change", this.onManifestChanged);
                if (this.data.manifest.migratedFromFormatVersion != null)
                    this.data.manifest.emit("change");
                this.system = SupCore.systems[this.data.manifest.pub.systemId];
                if (this.system == null) {
                    callback(new Error(`The system ${this.data.manifest.pub.systemId} is not installed. Run "node server install ${this.data.manifest.pub.systemId}" to install it.`));
                }
                else {
                    this.buildsPath = path.join(buildsPath, this.data.manifest.pub.id);
                    callback(null);
                }
            };
            fs.readFile(path.join(this.projectPath, "manifest.json"), { encoding: "utf8" }, (err, manifestJSON) => {
                if (err != null) {
                    callback(err);
                    return;
                }
                let manifestData;
                try {
                    manifestData = JSON.parse(manifestJSON);
                }
                catch (err) {
                    callback(err);
                    return;
                }
                try {
                    schemas.validate(manifestData, "projectManifest");
                }
                catch (err) {
                    callback(err);
                    return;
                }
                done(manifestData);
            });
        };
        const setupNextBuildId = (callback) => {
            fs.readdir(this.buildsPath, (err, entryIds) => {
                if (err != null && err.code !== "ENOENT") {
                    callback(err);
                    return;
                }
                this.nextBuildId = 0;
                if (entryIds != null) {
                    for (const entryId of entryIds) {
                        const entryBuildId = parseInt(entryId, 10);
                        if (isNaN(entryBuildId))
                            continue;
                        this.nextBuildId = Math.max(entryBuildId + 1, this.nextBuildId);
                    }
                }
                callback(null);
            });
        };
        const ensureRequiredFoldersExist = (callback) => {
            // These folders might not exist if the project was checked out from source control
            // But we assume they do when saving resources or rooms, so let's recreate them.
            const folders = ["resources", "rooms"];
            async.each(folders, (folder, cb) => {
                fs.mkdir(path.join(this.projectPath, folder), (err) => {
                    if (err != null && err.code !== "EEXIST") {
                        cb(err);
                        return;
                    }
                    cb();
                });
            }, callback);
        };
        const loadEntries = (callback) => {
            fs.readFile(path.join(this.projectPath, "entries.json"), { encoding: "utf8" }, (err, entriesJSON) => {
                if (err != null) {
                    callback(err);
                    return;
                }
                let entriesData;
                try {
                    entriesData = JSON.parse(entriesJSON);
                }
                catch (err) {
                    callback(err);
                    return;
                }
                if (this.data.manifest.migratedFromFormatVersion != null && this.data.manifest.migratedFromFormatVersion <= 5) {
                    let nextEntryId = 0;
                    let walk = (node) => {
                        const intNodeId = parseInt(node.id, 10);
                        nextEntryId = Math.max(nextEntryId, intNodeId);
                        if (node.type == null)
                            for (const childNode of node.children)
                                walk(childNode);
                    };
                    for (const node of entriesData)
                        walk(node);
                    nextEntryId++;
                    entriesData = { nextEntryId, nodes: entriesData };
                }
                try {
                    schemas.validate(entriesData, "projectEntries");
                }
                catch (err) {
                    callback(err);
                    return;
                }
                this.data.entries = new SupCore.Data.Entries(entriesData.nodes, entriesData.nextEntryId, this);
                this.data.entries.on("change", this.onEntriesChanged);
                if (this.data.manifest.migratedFromFormatVersion != null && this.data.manifest.migratedFromFormatVersion <= 5) {
                    this.saveEntries(callback);
                }
                else {
                    callback(null);
                }
            });
        };
        // migrate() is called after loadEntries()
        // because some migration code requires the entries to be loaded
        const migrate = (callback) => {
            migrateProject_1.default(this, callback);
        };
        const serve = (callback) => {
            // Setup the project's namespace
            this.io = globalIO.of(`/project:${this.data.manifest.pub.id}`);
            this.io.on("connection", this.onAddSocket);
            callback(null);
        };
        // prepareAssets() and prepareResources() is called after serve()
        // because badges rely on this.io being setup
        const prepareAssets = (callback) => {
            async.eachLimit(Object.keys(this.data.entries.byId), 512, (assetId, cb) => {
                // Ignore folders
                if (this.data.entries.byId[assetId].type == null) {
                    cb();
                    return;
                }
                this.data.assets.acquire(assetId, null, (err, asset) => {
                    if (err != null) {
                        cb(err);
                        return;
                    }
                    asset.restore();
                    this.data.assets.release(assetId, null, { skipUnloadDelay: true });
                    cb();
                });
            }, callback);
        };
        const prepareResources = (callback) => {
            async.each(Object.keys(this.system.data.resourceClasses), (resourceId, cb) => {
                this.data.resources.acquire(resourceId, null, (err, resource) => {
                    if (err != null) {
                        cb(err);
                        return;
                    }
                    resource.restore();
                    this.data.resources.release(resourceId, null, { skipUnloadDelay: true });
                    cb();
                });
            }, callback);
        };
        async.series([
            loadManifest, setupNextBuildId,
            ensureRequiredFoldersExist,
            loadEntries, migrate, serve,
            prepareAssets, prepareResources
        ], callback);
    }
    log(message) {
        SupCore.log(`[${this.data.manifest.pub.id} ${this.data.manifest.pub.name}] ${message}`);
    }
    save(callback) {
        const saveCallbacks = [];
        for (const callbackName in this.scheduledSaveCallbacks) {
            const callbackInfo = this.scheduledSaveCallbacks[callbackName];
            if (callbackInfo.timeoutId == null)
                continue;
            clearTimeout(callbackInfo.timeoutId);
            saveCallbacks.push(callbackInfo.callback);
        }
        this.scheduledSaveCallbacks = {};
        async.parallel(saveCallbacks, callback);
    }
    moveAssetFolderToTrash(trashedAssetFolder, callback) {
        const assetsPath = path.join(this.projectPath, "assets");
        const folderPath = path.join(assetsPath, trashedAssetFolder);
        if (!fs.existsSync(folderPath)) {
            callback(null);
            return;
        }
        const trashedAssetsPath = path.join(this.projectPath, "trashedAssets");
        fs.mkdir(trashedAssetsPath, (err) => {
            if (err != null && err.code !== "EEXIST")
                throw err;
            const index = trashedAssetFolder.lastIndexOf("/");
            if (index !== -1)
                trashedAssetFolder = trashedAssetFolder.slice(index);
            const newFolderPath = path.join(trashedAssetsPath, trashedAssetFolder);
            fs.rename(folderPath, newFolderPath, callback);
        });
    }
    removeRemoteClient(socketId) {
        delete this.clientsBySocketId[socketId];
    }
    markMissingDependency(dependentAssetIds, missingAssetId) {
        for (const dependentAssetId of dependentAssetIds) {
            let missingAssetIds = [missingAssetId];
            const existingBadge = this.data.entries.badgesByEntryId[dependentAssetId].byId["missingDependencies"];
            if (existingBadge != null) {
                missingAssetIds = missingAssetIds.concat(existingBadge.data.missingAssetIds);
            }
            this.setBadge(dependentAssetId, "missingDependencies", "error", { missingAssetIds });
        }
    }
    setBadge(assetId, badgeId, type, data) {
        // console.log(`setBadge ${assetId} ${badgeId} ${type}`);
        const badges = this.data.entries.badgesByEntryId[assetId];
        const newBadge = { id: badgeId, type, data };
        const existingBadge = badges.byId[badgeId];
        if (existingBadge != null) {
            existingBadge.type = type;
            existingBadge.data = data;
            this.io.in("sub:entries").emit("set:badges", assetId, newBadge);
            return;
        }
        badges.add(newBadge, null, (err) => {
            this.io.in("sub:entries").emit("set:badges", assetId, newBadge);
        });
    }
    clearBadge(assetId, badgeId) {
        // console.log(`clearBadge ${assetId} ${badgeId}`);
        const badges = this.data.entries.badgesByEntryId[assetId];
        badges.remove(badgeId, (err) => {
            this.io.in("sub:entries").emit("clear:badges", assetId, badgeId);
        });
    }
    addDependencies(assetId, dependencyEntryIds) {
        const addedDependencyEntryIds = [];
        let missingAssetIds = [];
        let assetDependencies = this.data.entries.dependenciesByAssetId[assetId];
        if (assetDependencies == null)
            assetDependencies = this.data.entries.dependenciesByAssetId[assetId] = [];
        for (const depId of dependencyEntryIds) {
            assetDependencies.push(depId);
            const depEntry = this.data.entries.byId[depId];
            if (depEntry == null) {
                missingAssetIds.push(depId);
                continue;
            }
            const dependentAssetIds = depEntry.dependentAssetIds;
            if (dependentAssetIds.indexOf(assetId) === -1) {
                dependentAssetIds.push(assetId);
                addedDependencyEntryIds.push(depId);
            }
        }
        if (missingAssetIds.length > 0) {
            const existingBadge = this.data.entries.badgesByEntryId[assetId].byId["missingDependencies"];
            if (existingBadge != null)
                missingAssetIds = missingAssetIds.concat(existingBadge.data.missingAssetIds);
            this.setBadge(assetId, "missingDependencies", "error", { missingAssetIds });
        }
        if (addedDependencyEntryIds.length > 0) {
            this.io.in("sub:entries").emit("add:dependencies", assetId, addedDependencyEntryIds);
        }
    }
    removeDependencies(assetId, dependencyEntryIds) {
        const removedDependencyEntryIds = [];
        const missingAssetIds = [];
        let assetDependencies = this.data.entries.dependenciesByAssetId[assetId];
        if (assetDependencies == null)
            assetDependencies = this.data.entries.dependenciesByAssetId[assetId] = [];
        for (const depId of dependencyEntryIds) {
            assetDependencies.splice(assetDependencies.indexOf(depId), 1);
            const depEntry = this.data.entries.byId[depId];
            if (depEntry == null) {
                missingAssetIds.push(depId);
                continue;
            }
            const dependentAssetIds = depEntry.dependentAssetIds;
            const index = dependentAssetIds.indexOf(assetId);
            if (index !== -1) {
                dependentAssetIds.splice(index, 1);
                removedDependencyEntryIds.push(depId);
            }
        }
        if (missingAssetIds.length > 0) {
            const existingBadge = this.data.entries.badgesByEntryId[assetId].byId["missingDependencies"];
            if (existingBadge != null) {
                for (const missingAssetId of missingAssetIds) {
                    const index = existingBadge.data.missingAssetIds.indexOf(missingAssetId);
                    if (index !== -1) {
                        existingBadge.data.missingAssetIds.splice(index, 1);
                    }
                }
                if (existingBadge.data.missingAssetIds.length === 0)
                    this.clearBadge(assetId, "missingDependencies");
                else
                    this.setBadge(assetId, "missingDependencies", "error", existingBadge.data);
            }
        }
        if (removedDependencyEntryIds.length > 0) {
            this.io.in("sub:entries").emit("remove:dependencies", assetId, removedDependencyEntryIds);
        }
        if (assetDependencies.length === 0) {
            delete this.data.entries.dependenciesByAssetId[assetId];
        }
    }
}
exports.default = ProjectServer;
