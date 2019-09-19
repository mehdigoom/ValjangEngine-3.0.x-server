"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const async = require("async");
const fetch_1 = require("../../../../SupClient/fetch");
class Player {
    constructor(canvas, dataURL, options) {
        this.entriesById = {};
        this.entriesByPath = {};
        this.resources = {};
        this.assetsById = {};
        this.outerAssetsById = {};
        this.tick = (timestamp = 0) => {
            this.tickAnimationFrameId = requestAnimationFrame(this.tick);
            this.accumulatedTime += timestamp - this.lastTimestamp;
            this.lastTimestamp = timestamp;
            const { updates, timeLeft } = this.gameInstance.tick(this.accumulatedTime);
            this.accumulatedTime = timeLeft;
            if (this.gameInstance.input.exited) {
                cancelAnimationFrame(this.tickAnimationFrameId);
                return;
            }
            if (updates > 0)
                this.gameInstance.draw();
        };
        this.canvas = canvas;
        this.dataURL = dataURL;
        options.enableOnExit = true;
        this.gameInstance = new SupEngine.GameInstance(this.canvas, options);
    }
    load(progressCallback, callback) {
        let progress = 0;
        const innerProgressCallback = () => {
            progress++;
            const total = this.resourcesToLoad.length + this.assetsToLoad.length;
            progressCallback(progress, total);
        };
        async.series([
            (cb) => { this._loadManifest(cb); },
            (cb) => { this._loadResources(innerProgressCallback, cb); },
            (cb) => { this._loadAssets(innerProgressCallback, cb); },
            (cb) => { this._initPlugins(cb); },
            (cb) => { this._startPlugins(cb); },
            (cb) => { this._lateStartPlugins(cb); }
        ], callback);
    }
    _loadManifest(callback) {
        this.getAssetData("project.json", "json", (err, project) => {
            if (err != null) {
                callback(new Error("Failed to load game manifest"));
                return;
            }
            this.gameName = project.name;
            document.title = project.name;
            this.resourcesToLoad = Object.keys(SupRuntime.resourcePlugins);
            this.assetsToLoad = [];
            const walk = (asset, parent = "", storagePath = "") => {
                let children;
                if (asset.children != null) {
                    children = [];
                    for (const child of asset.children) {
                        children.push(child.name);
                    }
                }
                const path = `${parent}${asset.name}`;
                storagePath += `${asset.name} (${asset.id})`;
                this.assetsToLoad.push({ id: asset.id, name: asset.name, path, storagePath, type: asset.type, children });
                parent += `${asset.name}/`;
                storagePath += "/";
                if (asset.children == null)
                    return;
                for (const child of asset.children) {
                    walk(child, parent, storagePath);
                }
            };
            for (const asset of project.assets) {
                walk(asset);
            }
            callback();
        });
    }
    _loadResources(progressCallback, callback) {
        if (this.resourcesToLoad.length === 0) {
            callback();
            return;
        }
        let resourcesLoaded = 0;
        const onResourceLoaded = (err, resourceName, resource) => {
            if (err != null) {
                callback(new Error(`Failed to load resource ${resourceName}: ${err.message}`));
                return;
            }
            this.resources[resourceName] = resource;
            progressCallback();
            resourcesLoaded++;
            if (resourcesLoaded === this.resourcesToLoad.length)
                callback();
        };
        // NOTE: Have to use .forEach because of TS4091 (closure references block-scoped variable)
        this.resourcesToLoad.forEach((resourceName) => {
            const plugin = SupRuntime.resourcePlugins[resourceName];
            if (plugin == null) {
                // This resource isn't meant to be loaded at runtime, skip
                onResourceLoaded(null, resourceName, null);
                return;
            }
            plugin.loadResource(this, resourceName, (err, data) => { onResourceLoaded(err, resourceName, data); });
        });
    }
    _loadAssets(progressCallback, callback) {
        if (this.gameInstance.threeRenderer == null) {
            callback(new Error("Failed to initialize renderer. Your device might not support WebGL."));
            return;
        }
        if (this.assetsToLoad.length === 0) {
            callback();
            return;
        }
        let assetsLoaded = 0;
        const onAssetLoaded = (err, entry, asset) => {
            if (err != null) {
                callback(new Error(`Failed to load asset ${entry.path}: ${err.message}`));
                return;
            }
            this.entriesById[entry.id] = entry;
            this.entriesByPath[entry.path] = entry;
            this.assetsById[entry.id] = asset;
            progressCallback();
            assetsLoaded++;
            if (assetsLoaded === this.assetsToLoad.length)
                callback();
        };
        // NOTE: Have to use .forEach because of TS4091 (closure references block-scoped variable)
        this.assetsToLoad.forEach((entry) => {
            if (entry.children != null) {
                onAssetLoaded(null, entry, {});
                return;
            }
            const plugin = SupRuntime.plugins[entry.type];
            if (plugin == null || plugin.loadAsset == null) {
                console.warn(`Don't know how to load assets of type "${entry.type}"`);
                onAssetLoaded(null, entry, {});
                return;
            }
            plugin.loadAsset(this, entry, (err, data) => { onAssetLoaded(err, entry, data); });
        });
    }
    _initPlugins(callback) {
        async.each(Object.keys(SupRuntime.plugins), (name, cb) => {
            const plugin = SupRuntime.plugins[name];
            if (plugin.init != null)
                plugin.init(this, cb);
            else
                cb();
        }, callback);
    }
    _startPlugins(callback) {
        async.each(Object.keys(SupRuntime.plugins), (name, cb) => {
            const plugin = SupRuntime.plugins[name];
            if (plugin.start != null)
                plugin.start(this, cb);
            else
                cb();
        }, callback);
    }
    _lateStartPlugins(callback) {
        async.each(Object.keys(SupRuntime.plugins), (name, cb) => {
            const plugin = SupRuntime.plugins[name];
            if (plugin.lateStart != null)
                plugin.lateStart(this, cb);
            else
                cb();
        }, callback);
    }
    run() {
        this.lastTimestamp = 0;
        this.accumulatedTime = 0;
        this.canvas.focus();
        this.tick();
    }
    getAssetData(path, responseType, callback) {
        fetch_1.default(`${this.dataURL}${path}`, responseType, callback);
    }
    getOuterAsset(assetId) {
        let outerAsset = this.outerAssetsById[assetId];
        const asset = this.assetsById[assetId];
        const entry = this.entriesById[assetId];
        if (outerAsset == null && asset != null) {
            if (entry.type == null) {
                outerAsset = { name: entry.name, path: entry.path, type: "folder", children: entry.children };
            }
            else {
                let plugin = SupRuntime.plugins[this.entriesById[assetId].type];
                outerAsset = this.outerAssetsById[assetId] =
                    // Temporary check until every asset is correctly handled
                    (plugin.createOuterAsset != null) ? plugin.createOuterAsset(this, asset) : asset;
                outerAsset.name = entry.name;
                outerAsset.path = entry.path;
                outerAsset.type = entry.type;
            }
        }
        return outerAsset;
    }
    createActor() { throw new Error("Player.createActor should be defined by a scripting plugin"); }
    createComponent() { throw new Error("Player.createComponent should be defined by a scripting plugin"); }
}
exports.default = Player;
