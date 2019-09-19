"use strict";
/// <reference path="../../typescript/typescriptAPI/TypeScriptAPIPlugin.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
const convert = require("convert-source-map");
// No definition file for combine-source-map module
/* tslint:disable */
const combine = require("combine-source-map");
/* tslint:enable */
const compileTypeScript_1 = require("./compileTypeScript");
const globalNames = [];
const globals = {};
const globalDefs = {};
const scriptNames = [];
const scripts = {};
const actorComponentTypesByName = {};
const actorComponentAccessors = [];
function init(player, callback) {
    player.behaviorClasses = {};
    player.createActor = (name, parentActor, options) => {
        return new window.Sup.Actor(name, parentActor, options);
    };
    const plugins = SupCore.system.getPlugins("typescriptAPI");
    player.createComponent = (type, actor, config) => {
        if (type === "Behavior") {
            const behaviorClass = player.behaviorClasses[config.behaviorName];
            if (behaviorClass == null) {
                throw new Error(`Could not find a behavior class named "${config.behaviorName}" for actor "${actor.getName()}". ` +
                    "Make sure you're using the class name, not the script's name and that the class is declared " +
                    "before the behavior component is created (or before the scene is loaded).");
            }
            return new behaviorClass(actor.__inner);
        }
        else {
            if (actorComponentTypesByName[type] == null) {
                actorComponentTypesByName[type] = window;
                const parts = plugins[type].exposeActorComponent.className.split(".");
                for (const part of parts)
                    actorComponentTypesByName[type] = actorComponentTypesByName[type][part];
            }
            return new actorComponentTypesByName[type](actor);
        }
    };
    for (const pluginName in plugins) {
        const plugin = plugins[pluginName];
        if (plugin.code != null) {
            globalNames.push(`${pluginName}.ts`);
            globals[`${pluginName}.ts`] = plugin.code;
        }
        if (plugin.defs != null)
            globalDefs[`${pluginName}.d.ts`] = plugin.defs;
        if (plugin.exposeActorComponent != null)
            actorComponentAccessors.push(`${plugin.exposeActorComponent.propertyName}: ${plugin.exposeActorComponent.className};`);
    }
    callback();
}
exports.init = init;
function start(player, callback) {
    console.log("Compiling scripts...");
    // Plug component accessors exposed by plugins into Sup.Actor class
    const joinedActorComponentAccessors = actorComponentAccessors.join("\n    ");
    globals["Sup.Actor.ts"] = globals["Sup.Actor.ts"].replace("// INSERT_COMPONENT_ACCESSORS", joinedActorComponentAccessors);
    globalDefs["Sup.Actor.d.ts"] = globalDefs["Sup.Actor.d.ts"].replace("// INSERT_COMPONENT_ACCESSORS", joinedActorComponentAccessors);
    // Make sure the Sup namespace, Sup.Actor and Sup.ActorComponent are compiled before everything else
    globalNames.unshift(globalNames.splice(globalNames.indexOf("Sup.Actor.ts"), 1)[0]);
    globalNames.unshift(globalNames.splice(globalNames.indexOf("Sup.ts"), 1)[0]);
    // Compile plugin globals
    const jsGlobals = compileTypeScript_1.default(globalNames, globals, `${globalDefs["lib.d.ts"]}\ndeclare var console, window, localStorage, player, SupEngine, SupRuntime, require;`, { sourceMap: false });
    if (jsGlobals.errors.length > 0) {
        for (const error of jsGlobals.errors)
            console.log(`${error.file}(${error.position.line}): ${error.message}`);
        callback(new Error("Compilation failed. Check the devtools (F12) for errors."));
        return;
    }
    // Compile game scripts
    let concatenatedGlobalDefs = "";
    for (const name in globalDefs)
        concatenatedGlobalDefs += globalDefs[name];
    const results = compileTypeScript_1.default(scriptNames, scripts, concatenatedGlobalDefs, { sourceMap: true });
    if (results.errors.length > 0) {
        for (const error of results.errors)
            console.log(`${error.file}(${error.position.line}): ${error.message}`);
        callback(new Error("Compilation failed. Check the devtools (F12) for errors."));
        return;
    }
    console.log("Compilation successful!");
    // Prepare source maps
    const getLineCounts = (text) => {
        let count = 1, index = -1;
        while (true) {
            index = text.indexOf("\n", index + 1);
            if (index === -1)
                break;
            count++;
        }
        return count;
    };
    jsGlobals.script = `(function() {
var player = _player; _player = undefined;
${jsGlobals.script}
})();
`;
    let line = getLineCounts(jsGlobals.script) + 2;
    const combinedSourceMap = combine.create("bundle.js");
    for (const file of results.files) {
        const comment = convert.fromObject(results.sourceMaps[file.name]).toComment();
        combinedSourceMap.addFile({ sourceFile: `/${player.gameName}/${file.name}`, source: file.text + `\n${comment}` }, { line });
        line += getLineCounts(file.text);
    }
    const code = `${jsGlobals.script}${results.script}
//` + `# sourceMappingURL=data:application/json;charset=utf-8;base64,${combinedSourceMap.base64()}`;
    // Execute the generated code
    const scriptFunction = new Function("_player", code);
    scriptFunction(player);
    callback();
}
exports.start = start;
function loadAsset(player, entry, callback) {
    scriptNames.push(`${entry.path}.ts`);
    player.getAssetData(`assets/${entry.storagePath}/script.ts`, "text", (err, script) => {
        scripts[`${entry.path}.ts`] = `${script}\n`;
        callback(null, script);
    });
}
exports.loadAsset = loadAsset;
