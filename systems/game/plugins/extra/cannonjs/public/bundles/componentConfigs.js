(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CannonBodyConfig extends SupCore.Data.Base.ComponentConfig {
    constructor(pub) { super(pub, CannonBodyConfig.schema); }
    static create() {
        const emptyConfig = {
            formatVersion: CannonBodyConfig.currentFormatVersion,
            mass: 0,
            fixedRotation: false,
            group: 1,
            mask: 1,
            shape: "box",
            positionOffset: { x: 0, y: 0, z: 0 },
            orientationOffset: { x: 0, y: 0, z: 0 },
            halfSize: { x: 0.5, y: 0.5, z: 0.5 },
            radius: 1,
            height: 1,
            segments: 16
        };
        return emptyConfig;
    }
    static migrate(pub) {
        if (pub.formatVersion === CannonBodyConfig.currentFormatVersion)
            return false;
        if (pub.formatVersion == null) {
            pub.formatVersion = 1;
            if (pub.offsetX != null) {
                pub.positionOffset = {
                    x: pub.offsetX,
                    y: pub.offsetY,
                    z: pub.offsetZ,
                };
                delete pub.offsetX;
                delete pub.offsetY;
                delete pub.offsetZ;
            }
            if (pub.halfWidth != null) {
                pub.halfSize = {
                    x: pub.halfWidth,
                    y: pub.halfHeight,
                    z: pub.halfDepth
                };
                delete pub.halfWidth;
                delete pub.halfHeight;
                delete pub.halfDepth;
            }
        }
        if (pub.formatVersion === 1) {
            if (pub.offset != null) {
                pub.positionOffset = pub.offset;
                delete pub.offset;
            }
            pub.orientationOffset = { x: 0, y: 0, z: 0 };
            pub.segments = 16;
            pub.group = 1;
            pub.mask = 1;
            pub.formatVersion = 2;
        }
        return true;
    }
}
CannonBodyConfig.schema = {
    formatVersion: { type: "integer" },
    mass: { type: "number", min: 0, mutable: true },
    fixedRotation: { type: "boolean", mutable: true },
    group: { type: "number", mutable: true },
    mask: { type: "number", mutable: true },
    shape: { type: "enum", items: ["box", "sphere", "cylinder"], mutable: true },
    positionOffset: {
        mutable: true,
        type: "hash",
        properties: {
            x: { type: "number", mutable: true },
            y: { type: "number", mutable: true },
            z: { type: "number", mutable: true },
        }
    },
    orientationOffset: {
        mutable: true,
        type: "hash",
        properties: {
            x: { type: "number", mutable: true },
            y: { type: "number", mutable: true },
            z: { type: "number", mutable: true }
        }
    },
    halfSize: {
        mutable: true,
        type: "hash",
        properties: {
            x: { type: "number", min: 0, mutable: true },
            y: { type: "number", min: 0, mutable: true },
            z: { type: "number", min: 0, mutable: true },
        }
    },
    radius: { type: "number", min: 0, mutable: true },
    height: { type: "number", min: 0, mutable: true },
    segments: { type: "number", min: 3, mutable: true }
};
CannonBodyConfig.currentFormatVersion = 2;
exports.default = CannonBodyConfig;

},{}],2:[function(require,module,exports){
"use strict";
/// <reference path="../../../default/scene/ComponentConfig.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
const CannonBodyConfig_1 = require("./CannonBodyConfig");
SupCore.system.registerPlugin("componentConfigs", "CannonBody", CannonBodyConfig_1.default);

},{"./CannonBodyConfig":1}]},{},[2]);
