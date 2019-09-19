"use strict";
/// <reference path="../../typescript/typescriptAPI/TypeScriptAPIPlugin.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
SupCore.system.registerPlugin("typescriptAPI", "Sup.Sound", {
    code: "namespace Sup { export class Sound extends Asset {} }",
    defs: "declare namespace Sup { class Sound extends Asset { dummySoundMember; } }"
});
SupCore.system.registerPlugin("typescriptAPI", "Sup.Audio", {
    code: fs.readFileSync(`${__dirname}/Sup.Audio.ts.txt`, { encoding: "utf8" }),
    defs: fs.readFileSync(`${__dirname}/Sup.Audio.d.ts.txt`, { encoding: "utf8" })
});
SupCore.system.registerPlugin("typescriptAPI", "Sup.Audio.SoundPlayer", {
    code: fs.readFileSync(`${__dirname}/Sup.Audio.SoundPlayer.ts.txt`, { encoding: "utf8" }),
    defs: fs.readFileSync(`${__dirname}/Sup.Audio.SoundPlayer.d.ts.txt`, { encoding: "utf8" })
});
