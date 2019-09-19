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
        class ModelRendererConfig extends SupCore.Data.Base.ComponentConfig {
            constructor(pub) { super(pub, ModelRendererConfig.schema); }
            static create() {
                const emptyConfig = {
                    formatVersion: ModelRendererConfig.currentFormatVersion,
                    modelAssetId: null,
                    animationId: null,
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
                if (pub.formatVersion === ModelRendererConfig.currentFormatVersion)
                    return false;
                if (pub.formatVersion == null) {
                    pub.formatVersion = 1;
                    // NOTE: overrideOpacity was introduced in ValjangEngine 0.8
                    if (pub.overrideOpacity == null)
                        pub.overrideOpacity = false;
                    if (pub.color == null)
                        pub.color = "ffffff";
                    // NOTE: These settings were introduced in ValjangEngine 0.7
                    if (pub.castShadow == null)
                        pub.castShadow = false;
                    if (pub.receiveShadow == null)
                        pub.receiveShadow = false;
                    if (pub.materialType == null)
                        pub.materialType = "basic";
                    // NOTE: Legacy stuff from ValjangEngine 0.4
                    if (typeof pub.modelAssetId === "number")
                        pub.modelAssetId = pub.modelAssetId.toString();
                    if (typeof pub.animationId === "number")
                        pub.animationId = pub.animationId.toString();
                }
                return true;
            }
            restore() {
                if (this.pub.modelAssetId != null)
                    this.emit("addDependencies", [this.pub.modelAssetId]);
                if (this.pub.shaderAssetId != null)
                    this.emit("addDependencies", [this.pub.shaderAssetId]);
            }
            destroy() {
                if (this.pub.modelAssetId != null)
                    this.emit("removeDependencies", [this.pub.modelAssetId]);
                if (this.pub.shaderAssetId != null)
                    this.emit("removeDependencies", [this.pub.shaderAssetId]);
            }
            setProperty(path, value, callback) {
                let oldDepId;
                if (path === "modelAssetId")
                    oldDepId = this.pub[path];
                if (path === "shaderAssetId")
                    oldDepId = this.pub.shaderAssetId;
                super.setProperty(path, value, (err, actualValue) => {
                    if (err != null) {
                        callback(err);
                        return;
                    }
                    if (path === "modelAssetId" || path === "shaderAssetId") {
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
        ModelRendererConfig.schema = {
            formatVersion: { type: "integer" },
            modelAssetId: { type: "string?", min: 0, mutable: true },
            animationId: { type: "string?", min: 0, mutable: true },
            castShadow: { type: "boolean", mutable: true },
            receiveShadow: { type: "boolean", mutable: true },
            color: { type: "string", length: 6, mutable: true },
            overrideOpacity: { type: "boolean", mutable: true },
            opacity: { type: "number?", min: 0, max: 1, mutable: true },
            materialType: { type: "enum", items: ["basic", "phong", "shader"], mutable: true },
            shaderAssetId: { type: "string?", min: 0, mutable: true }
        };
        ModelRendererConfig.currentFormatVersion = 1;
        exports.default = ModelRendererConfig;

    }, {}],
    2: [function(require, module, exports) {
        "use strict";
        /// <reference path="../../scene/ComponentConfig.d.ts" />
        Object.defineProperty(exports, "__esModule", { value: true });
        const ModelRendererConfig_1 = require("./ModelRendererConfig");
        SupCore.system.registerPlugin("componentConfigs", "ModelRenderer", ModelRendererConfig_1.default);

    }, { "./ModelRendererConfig": 1 }]
}, {}, [2]);