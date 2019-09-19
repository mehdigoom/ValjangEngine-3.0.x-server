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
        class TextRendererConfig extends SupCore.Data.Base.ComponentConfig {
            constructor(pub) { super(pub, TextRendererConfig.schema); }
            static create() {
                const emptyConfig = {
                    formatVersion: TextRendererConfig.currentFormatVersion,
                    fontAssetId: null,
                    text: "Text",
                    alignment: "center",
                    verticalAlignment: "center",
                    size: null,
                    color: null,
                    overrideOpacity: false,
                    opacity: null
                };
                return emptyConfig;
            }
            static migrate(pub) {
                if (pub.formatVersion === TextRendererConfig.currentFormatVersion)
                    return false;
                if (pub.formatVersion == null) {
                    pub.formatVersion = 1;
                    // NOTE: Legacy stuff from ValjangEngine 0.7
                    if (pub.color != null && pub.color.length !== 6)
                        pub.color = "ffffff";
                    // NOTE: Migration from old "align" property
                    if (pub.align != null) {
                        pub.alignment = pub.align;
                        delete pub.align;
                    }
                    if (pub.verticalAlignment == null)
                        pub.verticalAlignment = "center";
                }
                if (pub.formatVersion === 1) {
                    pub.overrideOpacity = false;
                    pub.opacity = null;
                    pub.formatVersion = 2;
                }
                return true;
            }
            restore() {
                if (this.pub.fontAssetId != null)
                    this.emit("addDependencies", [this.pub.fontAssetId]);
            }
            destroy() {
                if (this.pub.fontAssetId != null)
                    this.emit("removeDependencies", [this.pub.fontAssetId]);
            }
            setProperty(path, value, callback) {
                let oldDepId;
                if (path === "fontAssetId")
                    oldDepId = this.pub.fontAssetId;
                super.setProperty(path, value, (err, actualValue) => {
                    if (err != null) {
                        callback(err);
                        return;
                    }
                    if (path === "fontAssetId") {
                        if (oldDepId != null)
                            this.emit("removeDependencies", [oldDepId]);
                        if (actualValue != null)
                            this.emit("addDependencies", [actualValue]);
                    }
                    callback(null, actualValue);
                });
            }
        }
        TextRendererConfig.schema = {
            formatVersion: { type: "integer" },
            fontAssetId: { type: "string?", min: 0, mutable: true },
            text: { type: "string", min: 0, mutable: true },
            alignment: { type: "enum", items: ["left", "center", "right"], mutable: true },
            verticalAlignment: { type: "enum", items: ["top", "center", "bottom"], mutable: true },
            size: { type: "integer?", min: 0, mutable: true },
            color: { type: "string?", length: 6, mutable: true },
            overrideOpacity: { type: "boolean", mutable: true },
            opacity: { type: "number?", min: 0, max: 1, mutable: true }
        };
        TextRendererConfig.currentFormatVersion = 2;
        exports.default = TextRendererConfig;

    }, {}],
    2: [function(require, module, exports) {
        "use strict";
        /// <reference path="../../scene/ComponentConfig.d.ts" />
        Object.defineProperty(exports, "__esModule", { value: true });
        const TextRendererConfig_1 = require("./TextRendererConfig");
        SupCore.system.registerPlugin("componentConfigs", "TextRenderer", TextRendererConfig_1.default);

    }, { "./TextRendererConfig": 1 }]
}, {}, [2]);