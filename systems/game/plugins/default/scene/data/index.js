"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SceneSettingsResource_1 = require("./SceneSettingsResource");
const SceneAsset_1 = require("./SceneAsset");
SupCore.system.data.registerResource("sceneSettings", SceneSettingsResource_1.default);
SupCore.system.data.registerAssetClass("scene", SceneAsset_1.default);
