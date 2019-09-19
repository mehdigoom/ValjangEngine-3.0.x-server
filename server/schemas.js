"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tv4 = require("tv4");
// Server config
const config = {
    type: "object",
    properties: {
        serverName: { type: "string" },
        mainPort: { type: "number" },
        buildPort: { type: "number" },
        password: { type: "string" },
        sessionSecret: { type: "string" },
        maxRecentBuilds: { type: "number", min: 1 }
    }
};
// Project manifest
const projectManifest = {
    type: "object",
    properties: {
        id: { type: "string", minLength: 4, maxLength: 4 },
        name: { type: "string", minLength: 1, maxLength: 80 },
        description: { type: "string", maxLength: 300 },
        // Introduced in ValjangEngine v0.15
        system: { type: "string" },
        formatVersion: { type: "integer", min: 0 }
    },
    required: ["id", "name", "description"]
};
// Project entries
const projectEntry = {
    type: "object",
    properties: {
        // IDs used to be integers but are now serialized as strings
        id: { type: ["integer", "string"] },
        name: { type: "string", minLength: 1, maxLength: 80 },
        type: { type: ["string", "null"] },
        children: {
            type: "array",
            items: { $ref: "#/definitions/projectEntry" }
        }
    },
    required: ["id", "name"]
};
const projectEntries = {
    definitions: { projectEntry },
    type: "object",
    properties: {
        // IDs used to be integers but are now serialized as strings
        id: { type: "integer" },
        nodes: {
            type: "array",
            items: { $ref: "#/definitions/projectEntry" }
        }
    },
    required: ["nextEntryId", "nodes"]
};
const schemas = { config, projectManifest, projectEntries };
function validate(obj, schemaName) {
    const schema = schemas[schemaName];
    const result = tv4.validateResult(obj, schema);
    if (!result.valid) {
        throw new Error(`${result.error.dataPath} (${result.error.schemaPath}): ${result.error.message}`);
    }
    return true;
}
exports.validate = validate;
