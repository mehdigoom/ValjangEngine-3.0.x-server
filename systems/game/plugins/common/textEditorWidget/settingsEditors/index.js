"use strict";
/// <reference path="../../settings/settingsEditors/SettingsEditorPlugin.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
const TextEditorSettingsEditor_1 = require("./TextEditorSettingsEditor");
SupClient.registerPlugin("settingsEditors", "TextEditor", {
    namespace: "editors",
    editor: TextEditorSettingsEditor_1.default
});
