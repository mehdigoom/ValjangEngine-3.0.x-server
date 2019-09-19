"use strict";
/// <reference path="../../../common/settings/settingsEditors/SettingsEditorPlugin.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
const SceneSettingsEditor_1 = require("./SceneSettingsEditor");
SupClient.registerPlugin("settingsEditors", "Scene", {
    namespace: "editors",
    editor: SceneSettingsEditor_1.default
});
