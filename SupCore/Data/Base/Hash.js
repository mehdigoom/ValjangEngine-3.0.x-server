"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base = require("./index");
const events_1 = require("events");
class Hash extends events_1.EventEmitter {
    constructor(pub, schema) {
        super();
        this.pub = pub;
        this.schema = schema;
    }
    setProperty(path, value, callback) {
        const parts = path.split(".");
        let rule = this.schema[parts[0]];
        for (const part of parts.slice(1)) {
            rule = rule.properties[part];
            if (rule.type === "any")
                break;
        }
        if (rule == null) {
            callback(`Invalid key: ${path}`);
            return;
        }
        if (rule.type !== "any") {
            const violation = base.getRuleViolation(value, rule);
            if (violation != null) {
                callback(`Invalid value for ${path}: ${base.formatRuleViolation(violation)}`);
                return;
            }
        }
        let obj = this.pub;
        for (const part of parts.slice(0, parts.length - 1))
            obj = obj[part];
        obj[parts[parts.length - 1]] = value;
        callback(null, value);
        this.emit("change");
    }
    client_setProperty(path, value) {
        const parts = path.split(".");
        let obj = this.pub;
        for (const part of parts.slice(0, parts.length - 1))
            obj = obj[part];
        obj[parts[parts.length - 1]] = value;
    }
}
exports.default = Hash;
