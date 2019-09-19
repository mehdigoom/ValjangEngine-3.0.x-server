"use strict";
/// <reference path="../../typescript/typescriptAPI/TypeScriptAPIPlugin.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
SupCore.system.registerPlugin("typescriptAPI", "Sup.Game", {
    code: fs.readFileSync(`${__dirname}/Sup.Game.ts.txt`, { encoding: "utf8" }),
    defs: fs.readFileSync(`${__dirname}/Sup.Game.d.ts.txt`, { encoding: "utf8" })
});
