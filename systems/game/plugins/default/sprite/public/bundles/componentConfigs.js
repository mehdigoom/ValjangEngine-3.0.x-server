(function() {
    function r(e, n, t) {
        function o(i, f) { if (!n[i]) { if (!e[i]) { var c = "function" == typeof require && require; if (!f && c) return c(i, !0); if (u) return u(i, !0); var a = new Error("Cannot find module '" + i + "'"); throw a.code = "MODULE_NOT_FOUND", a } var p = n[i] = { exports: {} };
                e[i][0].call(p.exports, function(r) { var n = e[i][1][r]; return o(n || r) }, p, p.exports, r, e, n, t) } return n[i].exports } for (var u = "function" == typeof require && require, i = 0; i < t.length; i++) o(t[i]); return o } return r })()({
    1: [function(require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        class SpriteRendererConfig extends SupCore.Data.Base.ComponentConfig {
            constructor(pub) { super(pub, SpriteRendererConfig.schema); }
            static create() {
                const emptyConfig = {
                    formatVersion: SpriteRendererConfig.currentFormatVersion,
                    spriteAssetId: null,
                    animationId: null,
                    horizontalFlip: false,
                    verticalFlip: false,
                    castShadow: false,
                    receiveShadow: false,
                    color: "ffffff",
                    overrideOpacity: false,
                    opacity: null,
                    materialType: "basic",
                    shaderAssetId: null
                };
                return emptyConfig;
            }
            static migrate(pub) {
                if (pub.formatVersion === SpriteRendererConfig.currentFormatVersion)
                    return false;
                if (pub.formatVersion == null) {
                    pub.formatVersion = 1;
                    // NOTE: Settings introduced in ValjangEngine 0.8
                    if (pub.overrideOpacity == null)
                        pub.overrideOpacity = false;
                    if (pub.color == null)
                        pub.color = "ffffff";
                    if (pub.horizontalFlip == null)
                        pub.horizontalFlip = false;
                    if (pub.verticalFlip == null)
                        pub.verticalFlip = false;
                    // NOTE: Settings introduced in ValjangEngine 0.7
                    if (pub.castShadow == null)
                        pub.castShadow = false;
                    if (pub.receiveShadow == null)
                        pub.receiveShadow = false;
                    if (pub.materialType == null)
                        pub.materialType = "basic";
                    // NOTE: Legacy stuff from ValjangEngine 0.4
                    if (typeof pub.spriteAssetId === "number")
                        pub.spriteAssetId = pub.spriteAssetId.toString();
                    if (typeof pub.animationId === "number")
                        pub.animationId = pub.animationId.toString();
                }
                return true;
            }
            restore() {
                if (this.pub.spriteAssetId != null)
                    this.emit("addDependencies", [this.pub.spriteAssetId]);
                if (this.pub.shaderAssetId != null)
                    this.emit("addDependencies", [this.pub.shaderAssetId]);
            }
            destroy() {
                if (this.pub.spriteAssetId != null)
                    this.emit("removeDependencies", [this.pub.spriteAssetId]);
                if (this.pub.shaderAssetId != null)
                    this.emit("removeDependencies", [this.pub.shaderAssetId]);
            }
            setProperty(path, value, callback) {
                let oldDepId;
                if (path === "spriteAssetId")
                    oldDepId = this.pub.spriteAssetId;
                if (path === "shaderAssetId")
                    oldDepId = this.pub.shaderAssetId;
                super.setProperty(path, value, (err, actualValue) => {
                    if (err != null) {
                        callback(err);
                        return;
                    }
                    if (path === "spriteAssetId" || path === "shaderAssetId") {
                        if (oldDepId != null)
                            this.emit("removeDependencies", [oldDepId]);
                        if (actualValue != null)
                            this.emit("addDependencies", [actualValue]);
                    }
                    if (path === "overrideOpacity")
                        this.pub.opacity = null;
                    callback(null, actualValue);
                });
            }
        }
        SpriteRendererConfig.schema = {
            formatVersion: { type: "integer" },
            spriteAssetId: { type: "string?", min: 0, mutable: true },
            animationId: { type: "string?", min: 0, mutable: true },
            horizontalFlip: { type: "boolean", mutable: true },
            verticalFlip: { type: "boolean", mutable: true },
            castShadow: { type: "boolean", mutable: true },
            receiveShadow: { type: "boolean", mutable: true },
            color: { type: "string?", length: 6, mutable: true },
            overrideOpacity: { type: "boolean", mutable: true },
            opacity: { type: "number?", min: 0, max: 1, mutable: true },
            materialType: { type: "enum", items: ["basic", "phong", "shader"], mutable: true },
            shaderAssetId: { type: "string?", min: 0, mutable: true }
        };
        SpriteRendererConfig.currentFormatVersion = 1;
        exports.default = SpriteRendererConfig;

    }, {}],
    2: [function(require, module, exports) {
        "use strict";
        /// <reference path="../../scene/ComponentConfig.d.ts" />
        Object.defineProperty(exports, "__esModule", { value: true });
        const SpriteRendererConfig_1 = require("./SpriteRendererConfig");
        SupCore.system.registerPlugin("componentConfigs", "SpriteRenderer", SpriteRendererConfig_1.default);

    }, { "./SpriteRendererConfig": 1 }]
}, {}, [2]);