"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SupData = require("./index");
const path = require("path");
// Plugin resources are assets managed by plugins outside the project's asset tree
// They might be used for project-wide plugin-specific settings for instance
class Resources extends SupData.Base.Dictionary {
    constructor(server) {
        super();
        this.server = server;
    }
    acquire(id, owner, callback) {
        if (this.server.system.data.resourceClasses[id] == null) {
            callback(new Error(`Invalid resource id: ${id}`), null);
            return;
        }
        super.acquire(id, owner, callback);
    }
    _load(id) {
        const resourceClass = this.server.system.data.resourceClasses[id];
        const resource = new resourceClass(id, null, this.server);
        resource.load(path.join(this.server.projectPath, `resources/${id}`));
        return resource;
    }
}
exports.default = Resources;
