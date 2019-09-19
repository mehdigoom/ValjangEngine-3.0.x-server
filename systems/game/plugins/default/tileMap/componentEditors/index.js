"use strict";
/// <reference path="../../scene/componentEditors/ComponentEditorPlugin.d.ts" />
/// <reference path="../../scene/componentEditors/ImportIntoScenePlugin.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
const TileMapRendererEditor_1 = require("./TileMapRendererEditor");
const importTileMapIntoScene = require("./importTileMapIntoScene");
SupClient.registerPlugin("componentEditors", "TileMapRenderer", TileMapRendererEditor_1.default);
SupClient.registerPlugin("importIntoScene", "tileMap", importTileMapIntoScene);
