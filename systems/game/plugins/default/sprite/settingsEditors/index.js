"use strict";
/// <reference path="../../../common/settings/settingsEditors/SettingsEditorPlugin.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
const SpriteSettingsEditor_1 = require("./SpriteSettingsEditor");
SupClient.registerPlugin("settingsEditors", "Sprite", {
    namespace: "editors",
    editor: SpriteSettingsEditor_1.default
});
