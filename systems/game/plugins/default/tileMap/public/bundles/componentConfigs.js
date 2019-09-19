(function() {
    function r(e, n, t) {
        function o(i, f) {
            if (!n[i]) {
                if (!e[i]) { var c = "function" == typeof require && require; if (!f && c) return c(i, !0); if (u) return u(i, !0); var a = new Error("Cannot find module '" + i + "'"); throw a.code = "MODULE_NOT_FOUND", a }
                var p = n[i] = { exports: {} };
                e[i][0].call(p.exports, function(r) { var n = e[i][1][r]; return o(n || r) }, p, p.exports, r, e, n, t)
            }
            return n[i].exports
        }
        for (var u = "function" == typeof require && require, i = 0; i < t.length; i++) o(t[i]);
        return o
    }
    return r
})()({
    1: [function(require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        class TileMapRendererConfig extends SupCore.Data.Base.ComponentConfig {
            constructor(pub) { super(pub, TileMapRendererConfig.schema); }
            static create() {
                const newConfig = {
                    formatVersion: TileMapRendererConfig.currentFormatVersion,
                    tileMapAssetId: null,
                    tileSetAssetId: null,
                    castShadow: false,
                    receiveShadow: false,
                    materialType: "basic",
                    shaderAssetId: null
                };
                return newConfig;
            }
            static migrate(pub) {
                if (pub.formatVersion === TileMapRendererConfig.currentFormatVersion)
                    return false;
                if (pub.formatVersion == null) {
                    pub.formatVersion = 1;
                    // NOTE: Legacy stuff from ValjangEngine 0.4
                    if (typeof pub.tileMapAssetId === "number")
                        pub.tileMapAssetId = pub.tileMapAssetId.toString();
                    if (typeof pub.tileSetAssetId === "number")
                        pub.tileSetAssetId = pub.tileSetAssetId.toString();
                    // NOTE: Legacy stuff from ValjangEngine 0.11
                    if (pub.castShadow == null)
                        pub.castShadow = false;
                    if (pub.receiveShadow == null)
                        pub.receiveShadow = false;
                    if (pub.materialType == null)
                        pub.materialType = "basic";
                }
                return true;
            }
            restore() {
                if (this.pub.tileMapAssetId != null)
                    this.emit("addDependencies", [this.pub.tileMapAssetId]);
                if (this.pub.tileSetAssetId != null)
                    this.emit("addDependencies", [this.pub.tileSetAssetId]);
            }
            destroy() {
                if (this.pub.tileMapAssetId != null)
                    this.emit("removeDependencies", [this.pub.tileMapAssetId]);
                if (this.pub.tileSetAssetId != null)
                    this.emit("removeDependencies", [this.pub.tileSetAssetId]);
            }
            setProperty(path, value, callback) {
                let oldDepId;
                if (path === "tileMapAssetId")
                    oldDepId = this.pub.tileMapAssetId;
                if (path === "tileSetAssetId")
                    oldDepId = this.pub.tileSetAssetId;
                super.setProperty(path, value, (err, actualValue) => {
                    if (err != null) {
                        callback(err, null);
                        return;
                    }
                    if (path === "tileMapAssetId" || path === "tileSetAssetId") {
                        if (oldDepId != null)
                            this.emit("removeDependencies", [oldDepId]);
                        if (actualValue != null)
                            this.emit("addDependencies", [actualValue]);
                    }
                    callback(null, actualValue);
                });
            }
        }
        TileMapRendererConfig.schema = {
            formatVersion: { type: "integer" },
            tileMapAssetId: { type: "string?", min: 0, mutable: true },
            tileSetAssetId: { type: "string?", min: 0, mutable: true },
            castShadow: { type: "boolean", mutable: true },
            receiveShadow: { type: "boolean", mutable: true },
            materialType: { type: "enum", items: ["basic", "phong", "shader"], mutable: true },
            shaderAssetId: { type: "string?", min: 0, mutable: true }
        };
        TileMapRendererConfig.currentFormatVersion = 1;
        exports.default = TileMapRendererConfig;

    }, {}],
    2: [function(require, module, exports) {
        "use strict";
        /// <reference path="../../scene/ComponentConfig.d.ts" />
        Object.defineProperty(exports, "__esModule", { value: true });
        const TileMapRendererConfig_1 = require("./TileMapRendererConfig");
        SupCore.system.registerPlugin("componentConfigs", "TileMapRenderer", TileMapRendererConfig_1.default);

    }, { "./TileMapRendererConfig": 1 }]
}, {}, [2]);