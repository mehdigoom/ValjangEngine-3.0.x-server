"use strict";
/// <reference path="../../../default/typescript/typescriptAPI/TypeScriptAPIPlugin.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
SupCore.system.registerPlugin("typescriptAPI", "EventEmitter", {
    code: null,
    defs: fs.readFileSync(`${__dirname}/EventEmitter.d.ts.txt`, { encoding: "utf8" })
});
