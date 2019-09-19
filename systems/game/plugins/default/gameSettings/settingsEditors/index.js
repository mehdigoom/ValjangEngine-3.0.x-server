"use strict";
/// <reference path="../../../common/settings/settingsEditors/SettingsEditorPlugin.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
const GameSettingsEditor_1 = require("./GameSettingsEditor");
SupClient.registerPlugin("settingsEditors", "Game", {
    namespace: "general",
    editor: GameSettingsEditor_1.default
});
