"use strict";
/// <reference path="../../typescript/typescriptAPI/TypeScriptAPIPlugin.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
SupCore.system.registerPlugin("typescriptAPI", "Sup.Shader", {
    code: fs.readFileSync(`${__dirname}/Sup.Shader.ts.txt`, { encoding: "utf8" }),
    defs: fs.readFileSync(`${__dirname}/Sup.Shader.d.ts.txt`, { encoding: "utf8" }),
});
