"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TileMapSettingsResource_1 = require("./TileMapSettingsResource");
const TileMapAsset_1 = require("./TileMapAsset");
const TileSetAsset_1 = require("./TileSetAsset");
SupCore.system.data.registerResource("tileMapSettings", TileMapSettingsResource_1.default);
SupCore.system.data.registerAssetClass("tileMap", TileMapAsset_1.default);
SupCore.system.data.registerAssetClass("tileSet", TileSetAsset_1.default);
