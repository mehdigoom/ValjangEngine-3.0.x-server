"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const gameSettings = require("./gameSettings");
const gameSettingsResource = require("./gameSettingsResource");
SupRuntime.registerPlugin("gameSettings", gameSettings);
SupRuntime.registerResource("gameSettings", gameSettingsResource);
