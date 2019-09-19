"use strict";
/// <reference path="../../scene/componentEditors/ComponentEditorPlugin.d.ts" />
/// <reference path="../../scene/componentEditors/ImportIntoScenePlugin.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
const SpriteRendererEditor_1 = require("./SpriteRendererEditor");
const importSpriteIntoScene = require("./importSpriteIntoScene");
SupClient.registerPlugin("componentEditors", "SpriteRenderer", SpriteRendererEditor_1.default);
SupClient.registerPlugin("importIntoScene", "sprite", importSpriteIntoScene);
