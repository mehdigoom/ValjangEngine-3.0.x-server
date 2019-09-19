"use strict";
/// <reference path="TypeScriptAPIPlugin.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
SupCore.system.registerPlugin("typescriptAPI", "lib", {
    defs: fs.readFileSync(`${__dirname}/../node_modules/typescript/lib/lib.core.d.ts`, { encoding: "utf8" }),
    code: "",
});
SupCore.system.registerPlugin("typescriptAPI", "Sup", {
    code: fs.readFileSync(`${__dirname}/Sup.ts.txt`, { encoding: "utf8" }),
    defs: fs.readFileSync(`${__dirname}/Sup.d.ts.txt`, { encoding: "utf8" }),
});
SupCore.system.registerPlugin("typescriptAPI", "Sup.Actor", {
    code: fs.readFileSync(`${__dirname}/Sup.Actor.ts.txt`, { encoding: "utf8" }),
    defs: fs.readFileSync(`${__dirname}/Sup.Actor.d.ts.txt`, { encoding: "utf8" }),
});
SupCore.system.registerPlugin("typescriptAPI", "Sup.Behavior", {
    code: fs.readFileSync(`${__dirname}/Sup.Behavior.ts.txt`, { encoding: "utf8" }),
    defs: fs.readFileSync(`${__dirname}/Sup.Behavior.d.ts.txt`, { encoding: "utf8" }),
});
SupCore.system.registerPlugin("typescriptAPI", "Sup.Math", {
    code: fs.readFileSync(`${__dirname}/Sup.Math.ts.txt`, { encoding: "utf8" }),
    defs: fs.readFileSync(`${__dirname}/Sup.Math.d.ts.txt`, { encoding: "utf8" }),
});
SupCore.system.registerPlugin("typescriptAPI", "Sup.Input", {
    code: fs.readFileSync(`${__dirname}/Sup.Input.ts.txt`, { encoding: "utf8" }),
    defs: fs.readFileSync(`${__dirname}/Sup.Input.d.ts.txt`, { encoding: "utf8" }),
});
SupCore.system.registerPlugin("typescriptAPI", "Sup.Storage", {
    code: fs.readFileSync(`${__dirname}/Sup.Storage.ts.txt`, { encoding: "utf8" }),
    defs: fs.readFileSync(`${__dirname}/Sup.Storage.d.ts.txt`, { encoding: "utf8" }),
});
SupCore.system.registerPlugin("typescriptAPI", "Camera", {
    code: fs.readFileSync(`${__dirname}/Sup.Camera.ts.txt`, { encoding: "utf8" }),
    defs: fs.readFileSync(`${__dirname}/Sup.Camera.d.ts.txt`, { encoding: "utf8" }),
    exposeActorComponent: { propertyName: "camera", className: "Sup.Camera" }
});
SupCore.system.registerPlugin("typescriptAPI", "Sup.Color", {
    code: fs.readFileSync(`${__dirname}/Sup.Color.ts.txt`, { encoding: "utf8" }),
    defs: fs.readFileSync(`${__dirname}/Sup.Color.d.ts.txt`, { encoding: "utf8" }),
});
