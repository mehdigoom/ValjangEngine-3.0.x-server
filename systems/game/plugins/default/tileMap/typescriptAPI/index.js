"use strict";
/// <reference path="../../typescript/typescriptAPI/TypeScriptAPIPlugin.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
SupCore.system.registerPlugin("typescriptAPI", "Sup.TileMap", {
    code: fs.readFileSync(`${__dirname}/Sup.TileMap.ts.txt`, { encoding: "utf8" }),
    defs: fs.readFileSync(`${__dirname}/Sup.TileMap.d.ts.txt`, { encoding: "utf8" })
});
SupCore.system.registerPlugin("typescriptAPI", "Sup.TileSet", {
    code: fs.readFileSync(`${__dirname}/Sup.TileSet.ts.txt`, { encoding: "utf8" }),
    defs: fs.readFileSync(`${__dirname}/Sup.TileSet.d.ts.txt`, { encoding: "utf8" })
});
SupCore.system.registerPlugin("typescriptAPI", "TileMapRenderer", {
    code: fs.readFileSync(`${__dirname}/Sup.TileMapRenderer.ts.txt`, { encoding: "utf8" }),
    defs: fs.readFileSync(`${__dirname}/Sup.TileMapRenderer.d.ts.txt`, { encoding: "utf8" }),
    exposeActorComponent: { propertyName: "tileMapRenderer", className: "Sup.TileMapRenderer" }
});
