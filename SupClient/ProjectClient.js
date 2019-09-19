"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ProjectClient {
    constructor(socket, options) {
        this.entriesSubscribers = [];
        this.assetsById = {};
        this.subscribersByAssetId = {};
        this.resourcesById = {};
        this.subscribersByResourceId = {};
        this.onWelcome = (clientId) => {
            this.id = clientId;
        };
        this.onAssetReceived = (assetId, assetType, err, assetData) => {
            // FIXME: The asset was probably trashed in the meantime, handle that
            if (err != null) {
                console.warn(`Got an error in ProjectClient.onAssetReceived: ${err}`);
                return;
            }
            const subscribers = this.subscribersByAssetId[assetId];
            if (subscribers == null)
                return;
            let asset = null;
            if (assetData != null) {
                asset = this.assetsById[assetId] = new SupCore.system.data.assetClasses[assetType](assetId, assetData);
                asset.client_load();
            }
            for (const subscriber of subscribers) {
                if (subscriber.onAssetReceived != null)
                    subscriber.onAssetReceived(assetId, asset);
            }
        };
        this.onAssetEdited = (assetId, command, ...args) => {
            const subscribers = this.subscribersByAssetId[assetId];
            if (subscribers == null)
                return;
            const asset = this.assetsById[assetId];
            Object.getPrototypeOf(asset)[`client_${command}`].apply(asset, args);
            for (const subscriber of subscribers) {
                if (subscriber.onAssetEdited != null)
                    subscriber.onAssetEdited(assetId, command, ...args);
            }
        };
        this.onAssetTrashed = (assetId) => {
            const subscribers = this.subscribersByAssetId[assetId];
            if (subscribers == null)
                return;
            for (const subscriber of subscribers) {
                if (subscriber.onAssetTrashed != null)
                    subscriber.onAssetTrashed(assetId);
            }
            this.assetsById[assetId].client_unload();
            delete this.assetsById[assetId];
            delete this.subscribersByAssetId[assetId];
        };
        this.onAssetRestored = (assetId, assetType, assetData) => {
            const subscribers = this.subscribersByAssetId[assetId];
            if (subscribers == null)
                return;
            this.assetsById[assetId].client_unload();
            const asset = this.assetsById[assetId] = new SupCore.system.data.assetClasses[assetType](assetId, assetData);
            asset.client_load();
            for (const subscriber of subscribers) {
                if (subscriber.onAssetRestored != null)
                    subscriber.onAssetRestored(assetId, asset);
            }
        };
        this.onResourceReceived = (resourceId, err, resourceData) => {
            if (err != null) {
                console.warn(`Got an error in ProjectClient.onResourceReceived: ${err}`);
                return;
            }
            const subscribers = this.subscribersByResourceId[resourceId];
            if (subscribers == null)
                return;
            let resource = null;
            if (resourceData != null)
                resource = this.resourcesById[resourceId] = new SupCore.system.data.resourceClasses[resourceId](resourceId, resourceData);
            for (const subscriber of subscribers) {
                if (subscriber.onResourceReceived != null)
                    subscriber.onResourceReceived(resourceId, resource);
            }
        };
        this.onResourceEdited = (resourceId, command, ...args) => {
            const subscribers = this.subscribersByResourceId[resourceId];
            if (subscribers == null)
                return;
            const resource = this.resourcesById[resourceId];
            Object.getPrototypeOf(resource)[`client_${command}`].apply(resource, args);
            for (const subscriber of subscribers) {
                if (subscriber.onResourceEdited != null)
                    subscriber.onResourceEdited(resourceId, command, ...args);
            }
        };
        this.onEntriesReceived = (err, entries, nextEntryId) => {
            this.entries = new SupCore.Data.Entries(entries, nextEntryId);
            this.socket.on("add:entries", this.onEntryAdded);
            this.socket.on("move:entries", this.onEntryMoved);
            this.socket.on("setProperty:entries", this.onSetEntryProperty);
            this.socket.on("save:entries", this.onEntrySaved);
            this.socket.on("trash:entries", this.onEntryTrashed);
            for (const subscriber of this.entriesSubscribers) {
                if (subscriber.onEntriesReceived != null)
                    subscriber.onEntriesReceived(this.entries);
            }
        };
        this.onEntryAdded = (entry, parentId, index) => {
            this.entries.client_add(entry, parentId, index);
            for (const subscriber of this.entriesSubscribers) {
                if (subscriber.onEntryAdded != null)
                    subscriber.onEntryAdded(entry, parentId, index);
            }
        };
        this.onEntryMoved = (id, parentId, index) => {
            this.entries.client_move(id, parentId, index);
            for (const subscriber of this.entriesSubscribers) {
                if (subscriber.onEntryMoved != null)
                    subscriber.onEntryMoved(id, parentId, index);
            }
        };
        this.onSetEntryProperty = (id, key, value) => {
            this.entries.client_setProperty(id, key, value);
            for (const subscriber of this.entriesSubscribers) {
                if (subscriber.onSetEntryProperty != null)
                    subscriber.onSetEntryProperty(id, key, value);
            }
        };
        this.onEntrySaved = (id, revisionId, revisionName) => {
            this.entries.client_save(id, revisionId, revisionName);
            for (const subscriber of this.entriesSubscribers) {
                if (subscriber.onEntrySaved != null)
                    subscriber.onEntrySaved(id, revisionId, revisionName);
            }
        };
        this.onEntryTrashed = (id) => {
            this.entries.client_remove(id);
            for (const subscriber of this.entriesSubscribers) {
                if (subscriber.onEntryTrashed != null)
                    subscriber.onEntryTrashed(id);
            }
        };
        this.socket = socket;
        this.socket.on("welcome", this.onWelcome);
        this.socket.on("edit:assets", this.onAssetEdited);
        this.socket.on("trash:assets", this.onAssetTrashed);
        this.socket.on("restore:assets", this.onAssetRestored);
        this.socket.on("edit:resources", this.onResourceEdited);
        // Allow keeping an entries subscription alive at all times
        // Used in the scene editor to avoid constantly unsub'ing & resub'ing
        this.keepEntriesSubscription = options != null && options.subEntries;
        if (this.keepEntriesSubscription)
            this.socket.emit("sub", "entries", null, this.onEntriesReceived);
    }
    subEntries(subscriber) {
        this.entriesSubscribers.push(subscriber);
        if (this.entriesSubscribers.length === 1 && !this.keepEntriesSubscription) {
            this.socket.emit("sub", "entries", null, this.onEntriesReceived);
        }
        else if (this.entries != null)
            subscriber.onEntriesReceived(this.entries);
    }
    unsubEntries(subscriber) {
        this.entriesSubscribers.splice(this.entriesSubscribers.indexOf(subscriber), 1);
        if (this.entriesSubscribers.length === 0 && !this.keepEntriesSubscription) {
            this.socket.emit("unsub", "entries");
            this.socket.off("add:entries", this.onEntryAdded);
            this.socket.off("move:entries", this.onEntryMoved);
            this.socket.off("setProperty:entries", this.onSetEntryProperty);
            this.socket.off("save:entries", this.onEntrySaved);
            this.socket.off("trash:entries", this.onEntryTrashed);
            this.entries = null;
        }
    }
    subAsset(assetId, assetType, subscriber) {
        let subscribers = this.subscribersByAssetId[assetId];
        if (subscribers == null) {
            subscribers = this.subscribersByAssetId[assetId] = [];
            this.socket.emit("sub", "assets", assetId, this.onAssetReceived.bind(this, assetId, assetType));
        }
        else {
            const asset = this.assetsById[assetId];
            if (asset != null && subscriber.onAssetReceived != null)
                subscriber.onAssetReceived(assetId, asset);
        }
        subscribers.push(subscriber);
    }
    unsubAsset(assetId, subscriber) {
        const subscribers = this.subscribersByAssetId[assetId];
        if (subscribers == null)
            return;
        const index = subscribers.indexOf(subscriber);
        if (index === -1)
            return;
        subscribers.splice(index, 1);
        if (subscribers.length === 0) {
            delete this.subscribersByAssetId[assetId];
            if (this.assetsById[assetId] != null) {
                this.assetsById[assetId].client_unload();
                delete this.assetsById[assetId];
            }
            this.socket.emit("unsub", "assets", assetId);
        }
    }
    editAsset(assetId, command, ...args) {
        let callback;
        if (typeof args[args.length - 1] === "function")
            callback = args.pop();
        args.push((err, ack) => {
            if (err != null) {
                new SupClient.Dialogs.InfoDialog(err);
                return;
            }
            if (callback != null)
                callback(ack);
        });
        this.socket.emit("edit:assets", assetId, command, ...args);
    }
    editAssetNoErrorHandling(assetId, command, ...args) {
        this.socket.emit("edit:assets", assetId, command, ...args);
    }
    getAssetRevision(assetId, assetType, revisionId, onRevisionReceivedCallback) {
        this.socket.emit("getRevision:assets", assetId, revisionId, (err, assetData) => {
            if (err != null) {
                /* tslint:disable:no-unused-expression */
                new SupClient.Dialogs.InfoDialog(err);
                /* tslint:enable:no-unused-expression */
                return;
            }
            const asset = new SupCore.system.data.assetClasses[assetType](assetId, assetData);
            asset.client_load();
            onRevisionReceivedCallback(assetId, asset);
        });
    }
    subResource(resourceId, subscriber) {
        let subscribers = this.subscribersByResourceId[resourceId];
        if (subscribers == null) {
            subscribers = this.subscribersByResourceId[resourceId] = [];
            this.socket.emit("sub", "resources", resourceId, this.onResourceReceived.bind(this, resourceId));
        }
        else {
            const resource = this.resourcesById[resourceId];
            if (resource != null && subscriber.onResourceReceived != null)
                subscriber.onResourceReceived(resourceId, resource);
        }
        subscribers.push(subscriber);
    }
    unsubResource(resourceId, subscriber) {
        const subscribers = this.subscribersByResourceId[resourceId];
        if (subscribers == null)
            return;
        const index = subscribers.indexOf(subscriber);
        if (index === -1)
            return;
        subscribers.splice(index, 1);
        if (subscribers.length === 0) {
            delete this.subscribersByResourceId[resourceId];
            if (this.resourcesById[resourceId] != null) {
                delete this.resourcesById[resourceId];
            }
            this.socket.emit("unsub", "resources", resourceId);
        }
    }
    editResource(resourceId, command, ...args) {
        let callback;
        if (typeof args[args.length - 1] === "function")
            callback = args.pop();
        args.push((err, id) => {
            if (err != null) {
                new SupClient.Dialogs.InfoDialog(err);
                return;
            }
            if (callback != null)
                callback(id);
        });
        this.socket.emit("edit:resources", resourceId, command, ...args);
    }
}
exports.default = ProjectClient;
