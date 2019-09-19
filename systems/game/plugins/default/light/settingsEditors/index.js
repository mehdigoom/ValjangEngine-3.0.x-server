"use strict";
/// <reference path="../../../common/settings/settingsEditors/SettingsEditorPlugin.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
const LightSettingsEditor_1 = require("./LightSettingsEditor");
SupClient.registerPlugin("settingsEditors", "Light", {
    namespace: "editors",
    editor: LightSettingsEditor_1.default
});
