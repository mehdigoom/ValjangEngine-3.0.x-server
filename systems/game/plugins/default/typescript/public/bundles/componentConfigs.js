(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class BehaviorConfig extends SupCore.Data.Base.ComponentConfig {
    constructor(pub) {
        if (pub.propertyValues == null)
            pub.propertyValues = {};
        super(pub, BehaviorConfig.schema);
    }
    static create() { return { behaviorName: "", propertyValues: {} }; }
    server_setBehaviorPropertyValue(client, name, type, value, callback) {
        this.pub.propertyValues[name] = { type, value };
        callback(null, name, type, value);
    }
    client_setBehaviorPropertyValue(name, type, value) {
        this.pub.propertyValues[name] = { type, value };
    }
    server_clearBehaviorPropertyValue(client, name, callback) {
        delete this.pub.propertyValues[name];
        callback(null, name);
    }
    client_clearBehaviorPropertyValue(name) {
        delete this.pub.propertyValues[name];
    }
}
BehaviorConfig.schema = {
    behaviorName: { type: "string", mutable: true },
    propertyValues: {
        type: "hash",
        keys: { minLength: 1, maxLength: 80 },
        values: {
            type: "hash",
            properties: {
                type: { type: "string" },
                value: { type: "any" }
            }
        }
    }
};
exports.default = BehaviorConfig;

},{}],2:[function(require,module,exports){
"use strict";
/// <reference path="../../scene/ComponentConfig.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
const BehaviorConfig_1 = require("./BehaviorConfig");
SupCore.system.registerPlugin("componentConfigs", "Behavior", BehaviorConfig_1.default);

},{"./BehaviorConfig":1}]},{},[2]);
