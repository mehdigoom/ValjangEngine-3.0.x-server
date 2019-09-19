"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const script = require("./script");
const Behavior = require("./Behavior");
const behaviorProperties = require("./behaviorProperties");
SupRuntime.registerPlugin("script", script);
SupRuntime.registerPlugin("Behavior", Behavior);
SupRuntime.registerResource("behaviorProperties", behaviorProperties);
