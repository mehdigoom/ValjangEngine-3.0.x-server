"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class SpriteSettingsResource extends SupCore.Data.Base.Resource {
    constructor(id, pub, server) {
        super(id, pub, SpriteSettingsResource.schema, server);
    }
    init(callback) {
        this.pub = {
            filtering: "pixelated",
            pixelsPerUnit: 100,
            framesPerSecond: 10,
            alphaTest: 0.1
        };
        super.init(callback);
    }
}
SpriteSettingsResource.schema = {
    filtering: { type: "enum", items: ["pixelated", "smooth"], mutable: true },
    pixelsPerUnit: { type: "number", minExcluded: 0, mutable: true },
    framesPerSecond: { type: "number", minExcluded: 0, mutable: true },
    alphaTest: { type: "number", min: 0, max: 1, mutable: true }
};
exports.default = SpriteSettingsResource;
