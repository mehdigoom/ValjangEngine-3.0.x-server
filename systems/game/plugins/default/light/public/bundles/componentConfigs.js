(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class LightConfig extends SupCore.Data.Base.ComponentConfig {
    constructor(pub) { super(pub, LightConfig.schema); }
    static create() {
        const emptyConfig = {
            formatVersion: LightConfig.currentFormatVersion,
            type: "ambient",
            color: "ffffff",
            intensity: 1,
            distance: 0,
            angle: 60,
            target: { x: 0, y: 0, z: 0 },
            castShadow: false,
            shadowMapSize: { width: 512, height: 512 },
            shadowBias: 0,
            shadowCameraNearPlane: 0.1, shadowCameraFarPlane: 1000,
            shadowCameraFov: 50,
            shadowCameraSize: { top: 100, bottom: -100, left: -100, right: 100 }
        };
        return emptyConfig;
    }
    static migrate(pub) {
        if (pub.formatVersion === LightConfig.currentFormatVersion)
            return false;
        if (pub.formatVersion == null) {
            pub.formatVersion = 2;
            if (pub.shadowMapSize == null) {
                pub.shadowMapSize = { width: 512, height: 512 };
                pub.shadowBias = 0;
                pub.shadowCameraNearPlane = 0.1;
                pub.shadowCameraFarPlane = 1000;
                pub.shadowCameraFov = 50;
                pub.shadowCameraSize = { top: 100, bottom: -100, left: -100, right: 100 };
            }
        }
        if (pub.formatVersion === 1) {
            pub.formatVersion = 2;
            delete pub.shadowDarkness;
        }
        return true;
    }
}
LightConfig.schema = {
    formatVersion: { type: "integer" },
    type: { type: "enum", items: ["ambient", "point", "spot", "directional"], mutable: true },
    color: { type: "string", length: 6, mutable: true },
    intensity: { type: "number", min: 0, mutable: true },
    distance: { type: "number", min: 0, mutable: true },
    angle: { type: "number", min: 0, max: 90, mutable: true },
    target: {
        type: "hash",
        properties: {
            x: { type: "number", mutable: true },
            y: { type: "number", mutable: true },
            z: { type: "number", mutable: true }
        }
    },
    castShadow: { type: "boolean", mutable: true },
    shadowMapSize: {
        type: "hash",
        properties: {
            width: { type: "number", min: 1, mutable: true },
            height: { type: "number", min: 1, mutable: true },
        }
    },
    shadowBias: { type: "number", mutable: true },
    shadowDarkness: { type: "number", min: 0, max: 1, mutable: true },
    shadowCameraNearPlane: { type: "number", min: 0, mutable: true },
    shadowCameraFarPlane: { type: "number", min: 0, mutable: true },
    shadowCameraFov: { type: "number", min: 0, mutable: true },
    shadowCameraSize: {
        type: "hash",
        properties: {
            top: { type: "number", mutable: true },
            bottom: { type: "number", mutable: true },
            left: { type: "number", mutable: true },
            right: { type: "number", mutable: true },
        }
    }
};
LightConfig.currentFormatVersion = 2;
exports.default = LightConfig;

},{}],2:[function(require,module,exports){
"use strict";
/// <reference path="../../scene/ComponentConfig.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
const LightConfig_1 = require("./LightConfig");
SupCore.system.registerPlugin("componentConfigs", "Light", LightConfig_1.default);

},{"./LightConfig":1}]},{},[2]);
