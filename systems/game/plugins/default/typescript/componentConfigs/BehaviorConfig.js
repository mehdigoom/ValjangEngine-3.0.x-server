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
