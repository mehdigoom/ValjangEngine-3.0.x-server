"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class TileMapSettingsResource extends SupCore.Data.Base.Resource {
    constructor(id, pub, server) {
        super(id, pub, TileMapSettingsResource.schema, server);
    }
    init(callback) {
        this.pub = {
            formatVersion: TileMapSettingsResource.currentFormatVersion,
            pixelsPerUnit: 100,
            width: 30,
            height: 20,
            layerDepthOffset: 1,
            grid: {
                width: 40,
                height: 40
            }
        };
        super.init(callback);
    }
    migrate(resourcePath, pub, callback) {
        if (pub.formatVersion === TileMapSettingsResource.currentFormatVersion) {
            callback(false);
            return;
        }
        if (pub.formatVersion == null) {
            // NOTE: gridSize was renamed to grid.width and .height in Superpowers 0.8
            if (pub["gridSize"] != null) {
                pub.grid = { width: pub["gridSize"], height: pub["gridSize"] };
                delete pub["gridSize"];
            }
            pub.formatVersion = 1;
        }
        callback(true);
    }
}
TileMapSettingsResource.currentFormatVersion = 1;
TileMapSettingsResource.schema = {
    formatVersion: { type: "integer" },
    pixelsPerUnit: { type: "integer", minExcluded: 0, mutable: true },
    width: { type: "integer", min: 1, mutable: true },
    height: { type: "integer", min: 1, mutable: true },
    layerDepthOffset: { type: "number", min: 0, mutable: true },
    grid: {
        type: "hash",
        properties: {
            width: { type: "integer", min: 1, mutable: true },
            height: { type: "integer", min: 1, mutable: true }
        }
    }
};
exports.default = TileMapSettingsResource;
