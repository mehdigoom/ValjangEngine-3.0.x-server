"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CubicModelSettingsResource extends SupCore.Data.Base.Resource {
    constructor(id, pub, server) {
        super(id, pub, CubicModelSettingsResource.schema, server);
    }
    init(callback) {
        this.pub = {
            pixelsPerUnit: 16
        };
        super.init(callback);
    }
}
CubicModelSettingsResource.schema = {
    pixelsPerUnit: { type: "integer", min: 1, mutable: true }
};
exports.default = CubicModelSettingsResource;
