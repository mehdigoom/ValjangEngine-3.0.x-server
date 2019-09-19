"use strict";
/// <reference path="../../../common/settings/settingsEditors/SettingsEditorPlugin.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
const ProjectSettingsEditor_1 = require("./ProjectSettingsEditor");
SupClient.registerPlugin("settingsEditors", "Project", {
    namespace: "general",
    editor: ProjectSettingsEditor_1.default
});
