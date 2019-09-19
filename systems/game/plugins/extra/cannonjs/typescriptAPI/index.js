"use strict";
/// <reference path="../../../default/typescript/typescriptAPI/TypeScriptAPIPlugin.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
SupCore.system.registerPlugin("typescriptAPI", "CANNON", {
    code: "",
    defs: fs.readFileSync(`${__dirname}/CANNON.d.ts.txt`, { encoding: "utf8" })
});
SupCore.system.registerPlugin("typescriptAPI", "CannonBody", {
    code: fs.readFileSync(`${__dirname}/Sup.Cannon.Body.ts.txt`, { encoding: "utf8" }),
    defs: fs.readFileSync(`${__dirname}/Sup.Cannon.Body.d.ts.txt`, { encoding: "utf8" }),
    exposeActorComponent: { propertyName: "cannonBody", className: "Sup.Cannon.Body" }
});
