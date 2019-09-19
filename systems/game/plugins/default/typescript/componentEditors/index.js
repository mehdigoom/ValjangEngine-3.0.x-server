"use strict";
/// <reference path="../../scene/componentEditors/ComponentEditorPlugin.d.ts" />
/// <reference path="../../scene/componentEditors/ImportIntoScenePlugin.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
const BehaviorEditor_1 = require("./BehaviorEditor");
const importBehaviorIntoScene = require("./importBehaviorIntoScene");
SupClient.registerPlugin("componentEditors", "Behavior", BehaviorEditor_1.default);
SupClient.registerPlugin("importIntoScene", "script", importBehaviorIntoScene);
