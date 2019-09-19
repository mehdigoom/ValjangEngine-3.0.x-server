"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CubicModelSettingsResource_1 = require("./CubicModelSettingsResource");
const CubicModelAsset_1 = require("./CubicModelAsset");
SupCore.system.data.registerResource("cubicModelSettings", CubicModelSettingsResource_1.default);
SupCore.system.data.registerAssetClass("cubicModel", CubicModelAsset_1.default);
