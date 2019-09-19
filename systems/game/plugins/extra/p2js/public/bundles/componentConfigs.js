(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class P2BodyConfig extends SupCore.Data.Base.ComponentConfig {
    constructor(pub) { super(pub, P2BodyConfig.schema); }
    static create() {
        const emptyConfig = {
            formatVersion: P2BodyConfig.currentFormatVersion,
            mass: 0,
            fixedRotation: false,
            offsetX: 0,
            offsetY: 0,
            shape: "box",
            width: 1,
            height: 1,
            angle: 0,
            radius: 1,
            length: 1
        };
        return emptyConfig;
    }
    static migrate(pub) {
        if (pub.formatVersion === P2BodyConfig.currentFormatVersion)
            return false;
        if (pub.formatVersion == null) {
            pub.formatVersion = 1;
            // NOTE: "rectangle" was renamed to "box" in p2.js v0.7
            if (pub.shape === "rectangle")
                pub.shape = "box";
        }
        if (pub.formatVersion === 1) {
            pub.formatVersion = 2;
            pub.angle = 0;
        }
        return true;
    }
}
P2BodyConfig.schema = {
    formatVersion: { type: "integer" },
    mass: { type: "number", min: 0, mutable: true },
    fixedRotation: { type: "boolean", mutable: true },
    offsetX: { type: "number", mutable: true },
    offsetY: { type: "number", mutable: true },
    shape: { type: "enum", items: ["box", "circle"], mutable: true },
    width: { type: "number", min: 0, mutable: true },
    height: { type: "number", min: 0, mutable: true },
    angle: { type: "number", min: -360, max: 360, mutable: true },
    radius: { type: "number", min: 0, mutable: true }
};
P2BodyConfig.currentFormatVersion = 2;
exports.default = P2BodyConfig;

},{}],2:[function(require,module,exports){
"use strict";
/// <reference path="../../../default/scene/ComponentConfig.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
const P2BodyConfig_1 = require("./P2BodyConfig");
SupCore.system.registerPlugin("componentConfigs", "P2Body", P2BodyConfig_1.default);

},{"./P2BodyConfig":1}]},{},[2]);
