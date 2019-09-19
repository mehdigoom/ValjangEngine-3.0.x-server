"use strict";
/// <reference path="../../../default/typescript/typescriptAPI/TypeScriptAPIPlugin.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
SupCore.system.registerPlugin("typescriptAPI", "rng", {
    defs: fs.readFileSync(`${__dirname}/rng.d.ts.txt`, { encoding: "utf8" }),
    code: ""
});
