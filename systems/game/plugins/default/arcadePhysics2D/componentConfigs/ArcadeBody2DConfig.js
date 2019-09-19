"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ArcadeBody2DConfig extends SupCore.Data.Base.ComponentConfig {
    constructor(pub) { super(pub, ArcadeBody2DConfig.schema); }
    static create() {
        const newConfig = {
            formatVersion: ArcadeBody2DConfig.currentFormatVersion,
            type: "box",
            movable: true,
            width: 1,
            height: 1,
            offset: { x: 0, y: 0 },
            bounce: { x: 0, y: 0 },
            tileMapAssetId: null,
            tileSetPropertyName: null,
            layersIndex: null,
        };
        return newConfig;
    }
    static migrate(pub) {
        if (pub.formatVersion === ArcadeBody2DConfig.currentFormatVersion)
            return false;
        if (pub.formatVersion == null) {
            pub.formatVersion = 1;
            // Migration v0.12.0
            if (pub.offset == null) {
                pub.offset = { x: pub.offsetX, y: pub.offsetY };
                delete pub.offsetX;
                delete pub.offsetY;
            }
            if (pub.tileMapAssetId === "")
                pub.tileMapAssetId = null;
            // Migration v0.6.0
            if (pub.type == null) {
                pub.type = "box";
                pub.tileMapAssetId = null;
                pub.tileSetPropertyName = null;
                pub.layersIndex = null;
            }
        }
        if (pub.formatVersion === 1) {
            pub.formatVersion = 2;
            pub.bounce = { x: 0, y: 0 };
        }
        return true;
    }
}
ArcadeBody2DConfig.schema = {
    formatVersion: { type: "integer" },
    type: { type: "enum", items: ["box", "tileMap"], mutable: true },
    // Box
    movable: { type: "boolean", mutable: true },
    width: { type: "number", mutable: true },
    height: { type: "number", mutable: true },
    offset: {
        type: "hash",
        properties: {
            x: { type: "number", mutable: true },
            y: { type: "number", mutable: true },
        }
    },
    bounce: {
        type: "hash",
        properties: {
            x: { type: "number", mutable: true },
            y: { type: "number", mutable: true },
        }
    },
    // TileMap
    tileMapAssetId: { type: "string?", mutable: true },
    tileSetPropertyName: { type: "string?", mutable: true },
    layersIndex: { type: "string?", min: 0, mutable: true },
};
ArcadeBody2DConfig.currentFormatVersion = 2;
exports.default = ArcadeBody2DConfig;
