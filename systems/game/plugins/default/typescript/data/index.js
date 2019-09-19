"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BehaviorPropertiesResource_1 = require("./BehaviorPropertiesResource");
const ScriptAsset_1 = require("./ScriptAsset");
SupCore.system.data.registerResource("behaviorProperties", BehaviorPropertiesResource_1.default);
SupCore.system.data.registerAssetClass("script", ScriptAsset_1.default);
