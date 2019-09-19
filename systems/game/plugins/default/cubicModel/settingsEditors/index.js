"use strict";
/// <reference path="../../../common/settings/settingsEditors/SettingsEditorPlugin.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
const CubicModelSettingsEditor_1 = require("./CubicModelSettingsEditor");
SupClient.registerPlugin("settingsEditors", "CubicModel", {
    namespace: "editors",
    editor: CubicModelSettingsEditor_1.default
});
