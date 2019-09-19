"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Light = require("./Light");
const lightSettingsResource = require("./lightSettingsResource");
SupRuntime.registerPlugin("Light", Light);
SupRuntime.registerResource("lightSettings", lightSettingsResource);
