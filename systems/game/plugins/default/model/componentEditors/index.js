"use strict";
/// <reference path="../../scene/componentEditors/ComponentEditorPlugin.d.ts" />
/// <reference path="../../scene/componentEditors/ImportIntoScenePlugin.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
const ModelRendererEditor_1 = require("./ModelRendererEditor");
const importModelIntoScene = require("./importModelIntoScene");
SupClient.registerPlugin("componentEditors", "ModelRenderer", ModelRendererEditor_1.default);
SupClient.registerPlugin("importIntoScene", "model", importModelIntoScene);
