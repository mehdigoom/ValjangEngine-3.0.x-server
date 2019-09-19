"use strict";
/// <reference path="../../../default/typescript/typescriptAPI/TypeScriptAPIPlugin.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
SupCore.system.registerPlugin("typescriptAPI", "p2", {
    code: "",
    defs: fs.readFileSync(`${__dirname}/p2.d.ts.txt`, { encoding: "utf8" }),
});
SupCore.system.registerPlugin("typescriptAPI", "P2Body", {
    code: fs.readFileSync(`${__dirname}/Sup.P2.ts.txt`, { encoding: "utf8" }),
    defs: fs.readFileSync(`${__dirname}/Sup.P2.d.ts.txt`, { encoding: "utf8" }),
    exposeActorComponent: { propertyName: "p2Body", className: "Sup.P2.Body" }
});
