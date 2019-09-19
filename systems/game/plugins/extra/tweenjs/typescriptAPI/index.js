"use strict";
/// <reference path="../../../default/typescript/typescriptAPI/TypeScriptAPIPlugin.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
SupCore.system.registerPlugin("typescriptAPI", "Sup.Tween", {
    code: fs.readFileSync(`${__dirname}/Sup.Tween.ts.txt`, { encoding: "utf8" }),
    defs: fs.readFileSync(`${__dirname}/Sup.Tween.d.ts.txt`, { encoding: "utf8" })
});
SupCore.system.registerPlugin("typescriptAPI", "TWEEN", {
    defs: fs.readFileSync(`${__dirname}/TWEEN.d.ts.txt`, { encoding: "utf8" }),
    code: ""
});
