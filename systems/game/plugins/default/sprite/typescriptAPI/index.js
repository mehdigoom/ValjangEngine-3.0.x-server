"use strict";
/// <reference path="../../typescript/typescriptAPI/TypeScriptAPIPlugin.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
SupCore.system.registerPlugin("typescriptAPI", "Sup.Sprite", {
    code: fs.readFileSync(`${__dirname}/Sup.Sprite.ts.txt`, { encoding: "utf8" }),
    defs: fs.readFileSync(`${__dirname}/Sup.Sprite.d.ts.txt`, { encoding: "utf8" }),
});
SupCore.system.registerPlugin("typescriptAPI", "SpriteRenderer", {
    code: fs.readFileSync(`${__dirname}/Sup.SpriteRenderer.ts.txt`, { encoding: "utf8" }),
    defs: fs.readFileSync(`${__dirname}/Sup.SpriteRenderer.d.ts.txt`, { encoding: "utf8" }),
    exposeActorComponent: { propertyName: "spriteRenderer", className: "Sup.SpriteRenderer" }
});
