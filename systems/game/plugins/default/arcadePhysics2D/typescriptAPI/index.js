"use strict";
/// <reference path="../../typescript/typescriptAPI/TypeScriptAPIPlugin.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
SupCore.system.registerPlugin("typescriptAPI", "Sup.ArcadePhysics2D", {
    code: fs.readFileSync(`${__dirname}/Sup.ArcadePhysics2D.ts.txt`, { encoding: "utf8" }),
    defs: fs.readFileSync(`${__dirname}/Sup.ArcadePhysics2D.d.ts.txt`, { encoding: "utf8" }),
});
SupCore.system.registerPlugin("typescriptAPI", "ArcadeBody2D", {
    code: fs.readFileSync(`${__dirname}/Sup.ArcadePhysics2D.Body.ts.txt`, { encoding: "utf8" }),
    defs: fs.readFileSync(`${__dirname}/Sup.ArcadePhysics2D.Body.d.ts.txt`, { encoding: "utf8" }),
    exposeActorComponent: { propertyName: "arcadeBody2D", className: "Sup.ArcadePhysics2D.Body" },
});
