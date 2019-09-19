"use strict";
/// <reference path="../../typescript/typescriptAPI/TypeScriptAPIPlugin.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
SupCore.system.registerPlugin("typescriptAPI", "Sup.CubicModel", {
    code: fs.readFileSync(`${__dirname}/Sup.CubicModel.ts.txt`, { encoding: "utf8" }),
    defs: fs.readFileSync(`${__dirname}/Sup.CubicModel.d.ts.txt`, { encoding: "utf8" }),
});
SupCore.system.registerPlugin("typescriptAPI", "CubicModelRenderer", {
    code: fs.readFileSync(`${__dirname}/Sup.CubicModelRenderer.ts.txt`, { encoding: "utf8" }),
    defs: fs.readFileSync(`${__dirname}/Sup.CubicModelRenderer.d.ts.txt`, { encoding: "utf8" }),
    exposeActorComponent: { propertyName: "cubicModelRenderer", className: "Sup.CubicModelRenderer" }
});
