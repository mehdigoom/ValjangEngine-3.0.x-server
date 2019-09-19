"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* tslint:disable:no-unused-variable */
const obj = require("./obj");
const gltf = require("./gltf");
function createLogError(message, file, line) { return { file, line, type: "error", message }; }
exports.createLogError = createLogError;
function createLogWarning(message, file, line) { return { file, line, type: "warning", message }; }
exports.createLogWarning = createLogWarning;
function createLogInfo(message, file, line) { return { file, line, type: "info", message }; }
exports.createLogInfo = createLogInfo;
const modelImporters = { obj, gltf };
function default_1(files, callback) {
    let modelImporter = null;
    for (const file of files) {
        const filename = file.name;
        const extension = filename.substring(filename.lastIndexOf(".") + 1).toLowerCase();
        modelImporter = modelImporters[extension];
        if (modelImporter != null)
            break;
    }
    if (modelImporter == null) {
        callback([createLogError("No compatible importer found")]);
        return;
    }
    modelImporter.importModel(files, callback);
    return;
}
exports.default = default_1;
