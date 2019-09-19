"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaults = {
    serverName: null,
    mainPort: 4237,
    buildPort: 4238,
    password: "",
    sessionSecret: null,
    maxRecentBuilds: 10
};
// Loaded by start.ts
exports.server = null;
function setServerConfig(serverConfig) {
    exports.server = serverConfig;
}
exports.setServerConfig = setServerConfig;
