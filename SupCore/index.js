"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
const Data = require("./Data");
exports.Data = Data;
function setSystemsPath(path) {
    exports.systemsPath = path;
}
exports.setSystemsPath = setSystemsPath;
__export(require("./systems"));
function log(message) {
    const date = new Date();
    const text = `${date.toLocaleDateString()} ${date.toLocaleTimeString()} - ${message}`;
    console.log(text);
    return;
}
exports.log = log;
class LocalizedError {
    constructor(key, variables) {
        this.key = key;
        this.variables = variables;
    }
}
exports.LocalizedError = LocalizedError;
