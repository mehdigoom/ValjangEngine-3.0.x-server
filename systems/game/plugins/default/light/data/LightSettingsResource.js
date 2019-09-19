"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
class LightSettingsResource extends SupCore.Data.Base.Resource {
    constructor(id, pub, server) {
        super(id, pub, LightSettingsResource.schema, server);
    }
    init(callback) {
        this.pub = {
            shadowMapType: "basic"
        };
        super.init(callback);
    }
    clientExport(outputPath, callback) {
        SupApp.writeFile(path.join(outputPath, "resource.json"), JSON.stringify(this.pub), callback);
    }
}
LightSettingsResource.schema = {
    shadowMapType: { type: "enum", items: ["basic", "pcf", "pcfSoft"], mutable: true },
};
exports.default = LightSettingsResource;
