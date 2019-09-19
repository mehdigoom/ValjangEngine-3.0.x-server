"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const SupData = require("./index");
class Entries extends SupData.Base.TreeById {
    constructor(pub, nextEntryId, server) {
        super(pub, Entries.schema, nextEntryId);
        this.server = server;
        this.badgesByEntryId = {};
        this.dependenciesByAssetId = {};
        this.revisionsByEntryId = {};
        this.walk((node, parentNode) => {
            if (node.type == null)
                return;
            if (node.badges == null)
                node.badges = [];
            this.badgesByEntryId[node.id] = new SupData.Badges(node.badges);
            if (node.dependentAssetIds == null)
                node.dependentAssetIds = [];
            if (this.server != null) {
                node.revisions = [];
                let revisionList = [];
                try {
                    revisionList = fs.readdirSync(path.join(this.server.projectPath, `assetRevisions/${node.id}`));
                }
                catch (e) { /* Ignore if the entry doesn't have any revision */ }
                this.revisionsByEntryId[node.id] = {};
                for (const fullRevisionPath of revisionList) {
                    const separatorIndex = fullRevisionPath.indexOf("-");
                    const revisionId = fullRevisionPath.slice(0, separatorIndex);
                    const revisionName = fullRevisionPath.slice(separatorIndex + 1);
                    node.revisions.push({ id: revisionId, name: revisionName });
                    this.revisionsByEntryId[node.id][revisionId] = revisionName;
                }
            }
        });
    }
    add(node, parentId, index, callback) {
        const assetClass = this.server.system.data.assetClasses[node.type];
        if (node.type != null && assetClass == null) {
            callback("Invalid asset type");
            return;
        }
        super.add(node, parentId, index, (err, actualIndex) => {
            if (err != null) {
                callback(err);
                return;
            }
            let siblings = this.pub;
            if (parentId != null)
                siblings = (this.byId[parentId] != null) ? this.byId[parentId].children : null;
            node.name = SupData.ensureUniqueName(node.id, node.name, siblings);
            if (node.type != null) {
                const badges = new SupData.Badges(node.badges);
                this.badgesByEntryId[node.id] = badges;
                node.badges = badges.pub;
                node.revisions = [];
                this.revisionsByEntryId[node.id] = {};
            }
            else
                node.children = [];
            callback(null, actualIndex);
        });
    }
    client_add(node, parentId, index) {
        super.client_add(node, parentId, index);
        this.badgesByEntryId[node.id] = new SupData.Badges(node.badges);
    }
    move(id, parentId, index, callback) {
        const node = this.byId[id];
        if (node == null) {
            callback(`Invalid node id: ${id}`);
            return;
        }
        // Check that the requested parent is indeed a folder
        let siblings = this.pub;
        if (parentId != null)
            siblings = (this.byId[parentId] != null) ? this.byId[parentId].children : null;
        if (siblings == null) {
            callback(`Invalid parent node id: ${parentId}`);
            return;
        }
        if (SupData.hasDuplicateName(node.id, node.name, siblings)) {
            callback("There's already an entry with this name in this folder");
            return;
        }
        super.move(id, parentId, index, callback);
    }
    remove(id, callback) {
        const node = this.byId[id];
        if (node == null) {
            callback(`Invalid node id: ${id}`);
            return;
        }
        if (node.type == null && node.children.length !== 0) {
            callback("The folder must be empty");
            return;
        }
        delete this.badgesByEntryId[id];
        delete this.revisionsByEntryId[id];
        super.remove(id, callback);
    }
    setProperty(id, key, value, callback) {
        if (key === "name") {
            if (typeof (value) !== "string") {
                callback("Invalid value");
                return;
            }
            value = value.trim();
            const siblings = (this.parentNodesById[id] != null) ? this.parentNodesById[id].children : this.pub;
            if (SupData.hasDuplicateName(id, value, siblings)) {
                callback("There's already an entry with this name in this folder");
                return;
            }
        }
        super.setProperty(id, key, value, callback);
    }
    save(id, revisionName, callback) {
        const entry = this.byId[id];
        if (entry == null || entry.type == null) {
            callback("No such asset");
            return;
        }
        const revisionId = Date.now().toString();
        entry.revisions.push({ id: revisionId, name: revisionName });
        this.revisionsByEntryId[id][revisionId] = revisionName;
        callback(null, revisionId);
    }
    client_save(id, revisionId, revisionName) {
        const entry = this.byId[id];
        entry.revisions.push({ id: revisionId, name: revisionName });
    }
    getForStorage(ignoredEntryTypes) {
        const entries = [];
        const entriesById = {};
        this.walk((entry, parentEntry) => {
            if (ignoredEntryTypes != null && ignoredEntryTypes.indexOf(entry.type) !== -1)
                return;
            const savedEntry = { id: entry.id, name: entry.name, type: entry.type };
            if (entry.children != null)
                savedEntry.children = [];
            entriesById[savedEntry.id] = savedEntry;
            if (parentEntry == null)
                entries.push(savedEntry);
            else
                entriesById[parentEntry.id].children.push(savedEntry);
        });
        return entries;
    }
    getStoragePathFromId(id) {
        let fullStoragePath = `${this.byId[id].name} (${id})`;
        while (this.parentNodesById[id] != null) {
            const parentNode = this.parentNodesById[id];
            fullStoragePath = `${this.byId[parentNode.id].name} (${parentNode.id})/${fullStoragePath}`;
            id = parentNode.id;
        }
        return fullStoragePath;
    }
}
Entries.schema = {
    name: { type: "string", minLength: 1, maxLength: 80, mutable: true },
    type: { type: "string?" },
    badges: { type: "array?" },
    dependentAssetIds: { type: "array", items: { type: "string" } },
    revisions: {
        type: "array?",
        items: {
            type: "hash",
            properties: {
                id: { type: "string" },
                name: { type: "string" }
            }
        }
    },
};
exports.default = Entries;
