"use strict";
/// <reference path="./GameBuildSettings.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
const GameBuildSettingsEditor_1 = require("./GameBuildSettingsEditor");
const buildGame_1 = require("./buildGame");
SupClient.registerPlugin("build", "game", {
    settingsEditor: GameBuildSettingsEditor_1.default,
    build: buildGame_1.default
});
