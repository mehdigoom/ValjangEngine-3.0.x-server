"use strict";
/// <reference path="../../typescript/typescriptAPI/TypeScriptAPIPlugin.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
SupCore.system.registerPlugin("typescriptAPI", "Sup.Model", {
    code: "namespace Sup { export class Model extends Asset {} }",
    defs: "declare namespace Sup { class Model extends Asset { dummyModelMember; } }"
});
SupCore.system.registerPlugin("typescriptAPI", "ModelRenderer", {
    code: fs.readFileSync(`${__dirname}/Sup.ModelRenderer.ts.txt`, { encoding: "utf8" }),
    defs: fs.readFileSync(`${__dirname}/Sup.ModelRenderer.d.ts.txt`, { encoding: "utf8" }),
    exposeActorComponent: { propertyName: "modelRenderer", className: "Sup.ModelRenderer" }
});
