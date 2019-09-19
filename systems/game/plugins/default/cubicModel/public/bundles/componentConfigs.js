(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CubicModelRendererConfig extends SupCore.Data.Base.ComponentConfig {
    constructor(pub) { super(pub, CubicModelRendererConfig.schema); }
    static create() {
        const emptyConfig = {
            cubicModelAssetId: null // , animationId: null,
            // horizontalFlip: false, verticalFlip: false,
            // castShadow: false, receiveShadow: false,
            // color: "ffffff",
            // overrideOpacity: false, opacity: null,
            // materialType: "basic", shaderAssetId: null
        };
        return emptyConfig;
    }
    restore() {
        if (this.pub.cubicModelAssetId != null)
            this.emit("addDependencies", [this.pub.cubicModelAssetId]);
        // if (this.pub.shaderAssetId != null) this.emit("addDependencies", [ this.pub.shaderAssetId ]);
    }
    destroy() {
        if (this.pub.cubicModelAssetId != null)
            this.emit("removeDependencies", [this.pub.cubicModelAssetId]);
        // if (this.pub.shaderAssetId != null) this.emit("removeDependencies", [ this.pub.shaderAssetId ]);
    }
    setProperty(path, value, callback) {
        let oldDepId;
        if (path === "cubicModelAssetId")
            oldDepId = this.pub.cubicModelAssetId;
        // if (path === "shaderAssetId") oldDepId = this.pub.shaderAssetId;
        super.setProperty(path, value, (err, actualValue) => {
            if (err != null) {
                callback(err);
                return;
            }
            if (path === "cubicModelAssetId" || path === "shaderAssetId") {
                if (oldDepId != null)
                    this.emit("removeDependencies", [oldDepId]);
                if (actualValue != null)
                    this.emit("addDependencies", [actualValue]);
            }
            // if (path === "overrideOpacity") this.pub.opacity = null;
            callback(null, actualValue);
        });
    }
}
CubicModelRendererConfig.schema = {
    cubicModelAssetId: { type: "string?", min: 0, mutable: true },
};
exports.default = CubicModelRendererConfig;

},{}],2:[function(require,module,exports){
"use strict";
/// <reference path="../../scene/ComponentConfig.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
const CubicModelRendererConfig_1 = require("./CubicModelRendererConfig");
SupCore.system.registerPlugin("componentConfigs", "CubicModelRenderer", CubicModelRendererConfig_1.default);

},{"./CubicModelRendererConfig":1}]},{},[2]);
