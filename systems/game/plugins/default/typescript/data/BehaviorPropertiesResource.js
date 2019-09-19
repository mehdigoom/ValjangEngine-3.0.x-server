"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
class BehaviorPropertiesResource extends SupCore.Data.Base.Resource {
    constructor(id, pub, server) {
        super(id, pub, BehaviorPropertiesResource.schema, server);
    }
    setup() {
        this.behaviorNamesByScriptId = {};
        this.propertiesByNameByBehavior = {};
        for (const behaviorName in this.pub.behaviors) {
            const behavior = this.pub.behaviors[behaviorName];
            if (this.behaviorNamesByScriptId[behavior.scriptId] == null)
                this.behaviorNamesByScriptId[behavior.scriptId] = [];
            this.behaviorNamesByScriptId[behavior.scriptId].push(behaviorName);
            this.propertiesByNameByBehavior[behaviorName] = {};
            for (const property of behavior.properties)
                this.propertiesByNameByBehavior[behaviorName][property.name] = property;
        }
    }
    init(callback) {
        this.pub = { behaviors: {} };
        super.init(callback);
    }
    clientExport(outputPath, callback) {
        SupApp.writeFile(path.join(outputPath, "resource.json"), JSON.stringify(this.pub), callback);
    }
    setScriptBehaviors(scriptId, behaviors) {
        this.client_setScriptBehaviors(scriptId, behaviors);
        this.emit("edit", "setScriptBehaviors", scriptId, behaviors);
        this.emit("change");
    }
    client_setScriptBehaviors(scriptId, behaviors) {
        const oldBehaviorNames = (this.behaviorNamesByScriptId[scriptId] != null) ? this.behaviorNamesByScriptId[scriptId] : [];
        const newBehaviorNames = this.behaviorNamesByScriptId[scriptId] = [];
        for (const name in behaviors) {
            const behavior = behaviors[name];
            this.pub.behaviors[name] = { scriptId, line: behavior.line, parentBehavior: behavior.parentBehavior, properties: behavior.properties };
            const propertiesByName = this.propertiesByNameByBehavior[name] = {};
            for (const property of behavior.properties)
                propertiesByName[property.name] = property;
            newBehaviorNames.push(name);
        }
        for (const oldBehaviorName of oldBehaviorNames) {
            if (newBehaviorNames.indexOf(oldBehaviorName) !== -1)
                continue;
            delete this.propertiesByNameByBehavior[oldBehaviorName];
            delete this.pub.behaviors[oldBehaviorName];
        }
    }
    clearScriptBehaviors(scriptId) {
        this.client_clearScriptBehaviors(scriptId);
        this.emit("edit", "clearScriptBehaviors", scriptId);
        this.emit("change");
    }
    client_clearScriptBehaviors(scriptId) {
        let oldBehaviorNames = this.behaviorNamesByScriptId[scriptId];
        if (oldBehaviorNames == null)
            return;
        for (let oldBehaviorName of oldBehaviorNames) {
            delete this.pub.behaviors[oldBehaviorName];
            delete this.propertiesByNameByBehavior[oldBehaviorName];
        }
        delete this.behaviorNamesByScriptId[scriptId];
    }
}
BehaviorPropertiesResource.schema = {
    behaviors: {
        type: "hash",
        keys: { minLength: 1 },
        values: {
            type: "hash",
            properties: {
                scriptId: { type: "string" },
                parentBehavior: { type: "string" },
                properties: {
                    type: "array",
                    items: {
                        type: "hash",
                        properties: {
                            name: { type: "string" },
                            type: { type: "string" }
                        }
                    }
                }
            }
        }
    }
};
exports.default = BehaviorPropertiesResource;
