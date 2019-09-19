"use strict";
/// <reference path="ComponentEditorPlugin.d.ts" />
/// <reference path="ImportIntoScenePlugin.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
const CameraEditor_1 = require("./CameraEditor");
const importPrefabIntoScene = require("./importPrefabIntoScene");
SupClient.registerPlugin("componentEditors", "Camera", CameraEditor_1.default);
SupClient.registerPlugin("importIntoScene", "scene", importPrefabIntoScene);
