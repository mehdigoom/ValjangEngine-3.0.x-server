"use strict";
/// <reference path="../../typescript/typescriptAPI/TypeScriptAPIPlugin.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
SupCore.system.registerPlugin("typescriptAPI", "Light", {
    code: fs.readFileSync(`${__dirname}/Sup.Light.ts.txt`, { encoding: "utf8" }),
    defs: fs.readFileSync(`${__dirname}/Sup.Light.d.ts.txt`, { encoding: "utf8" }),
    exposeActorComponent: { propertyName: "light", className: "Sup.Light" }
});
