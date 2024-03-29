"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function setupComponent(player, component, config) {
    if (config.type === "box")
        component.setupBox(config);
    else if (config.type === "tileMap") {
        config.tileMapAsset = player.getOuterAsset(config.tileMapAssetId);
        if (config.tileMapAsset == null)
            throw new Error("Arcade Physics Body doesn't have a tile map associated.");
        config.tileSetAsset = player.getOuterAsset(config.tileMapAsset.__inner.data.tileSetId);
        component.setupTileMap(config);
    }
}
exports.setupComponent = setupComponent;
