"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SpriteSettingsResource_1 = require("./SpriteSettingsResource");
const SpriteAsset_1 = require("./SpriteAsset");
SupCore.system.data.registerResource("spriteSettings", SpriteSettingsResource_1.default);
SupCore.system.data.registerAssetClass("sprite", SpriteAsset_1.default);
