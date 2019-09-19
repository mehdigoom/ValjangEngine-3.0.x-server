"use strict";
/// <reference path="../../../default/typescript/typescriptAPI/TypeScriptAPIPlugin.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
SupCore.system.registerPlugin("typescriptAPI", "socketio", {
    code: "",
    defs: fs.readFileSync(`${__dirname}/socket.io-client.d.ts.txt`, { encoding: "utf8" })
});
