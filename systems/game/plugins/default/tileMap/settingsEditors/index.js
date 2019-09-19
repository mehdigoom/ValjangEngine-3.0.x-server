"use strict";
/// <reference path="../../../common/settings/settingsEditors/SettingsEditorPlugin.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
const TileMapSettingsEditor_1 = require("./TileMapSettingsEditor");
SupClient.registerPlugin("settingsEditors", "TileMap", {
    namespace: "editors",
    editor: TileMapSettingsEditor_1.default
});
