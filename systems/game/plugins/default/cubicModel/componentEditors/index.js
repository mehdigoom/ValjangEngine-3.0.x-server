"use strict";
/// <reference path="../../scene/componentEditors/ComponentEditorPlugin.d.ts" />
/// <reference path="../../scene/componentEditors/ImportIntoScenePlugin.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
const CubicModelRendererEditor_1 = require("./CubicModelRendererEditor");
const importCubicModelIntoScene = require("./importCubicModelIntoScene");
SupClient.registerPlugin("componentEditors", "CubicModelRenderer", CubicModelRendererEditor_1.default);
SupClient.registerPlugin("importIntoScene", "cubicModel", importCubicModelIntoScene);
