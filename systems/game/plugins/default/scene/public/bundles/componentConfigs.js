(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CameraConfig extends SupCore.Data.Base.ComponentConfig {
    constructor(pub) { super(pub, CameraConfig.schema); }
    static create() {
        const emptyConfig = {
            formatVersion: CameraConfig.currentFormatVersion,
            mode: "perspective",
            fov: 45,
            orthographicScale: 10,
            viewport: { x: 0, y: 0, width: 1, height: 1 },
            depth: 0,
            nearClippingPlane: 0.1,
            farClippingPlane: 1000
        };
        return emptyConfig;
    }
    static migrate(pub) {
        if (pub.formatVersion === CameraConfig.currentFormatVersion)
            return false;
        if (pub.formatVersion == null) {
            pub.formatVersion = 1;
            // NOTE: New setting introduced in v0.8
            if (pub.depth == null)
                pub.depth = 0;
            // NOTE: New settings introduced in v0.7
            if (pub.nearClippingPlane == null)
                pub.nearClippingPlane = 0.1;
            if (pub.farClippingPlane == null)
                pub.farClippingPlane = 1000;
        }
        return true;
    }
}
CameraConfig.schema = {
    formatVersion: { type: "integer" },
    mode: { type: "enum", items: ["perspective", "orthographic"], mutable: true },
    fov: { type: "number", min: 0.1, max: 179.9, mutable: true },
    orthographicScale: { type: "number", min: 0.1, mutable: true },
    viewport: {
        type: "hash",
        properties: {
            x: { type: "number", min: 0, max: 1, mutable: true },
            y: { type: "number", min: 0, max: 1, mutable: true },
            width: { type: "number", min: 0, max: 1, mutable: true },
            height: { type: "number", min: 0, max: 1, mutable: true },
        }
    },
    depth: { type: "number", mutable: true },
    nearClippingPlane: { type: "number", min: 0.1, mutable: true },
    farClippingPlane: { type: "number", min: 0.1, mutable: true }
};
CameraConfig.currentFormatVersion = 1;
exports.default = CameraConfig;

},{}],2:[function(require,module,exports){
"use strict";
/// <reference path="../../scene/ComponentConfig.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
const CameraConfig_1 = require("./CameraConfig");
SupCore.system.registerPlugin("componentConfigs", "Camera", CameraConfig_1.default);

},{"./CameraConfig":1}]},{},[2]);
