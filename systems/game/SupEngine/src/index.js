"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const THREE = require("three");
exports.THREE = THREE;
THREE.Euler.DefaultOrder = "YXZ";
const GameInstance_1 = require("./GameInstance");
exports.GameInstance = GameInstance_1.default;
const ActorTree_1 = require("./ActorTree");
exports.ActorTree = ActorTree_1.default;
const Actor_1 = require("./Actor");
exports.Actor = Actor_1.default;
const ActorComponent_1 = require("./ActorComponent");
exports.ActorComponent = ActorComponent_1.default;
const Input_1 = require("./Input");
exports.Input = Input_1.default;
const Audio_1 = require("./Audio");
exports.Audio = Audio_1.default;
const SoundPlayer_1 = require("./SoundPlayer");
exports.SoundPlayer = SoundPlayer_1.default;
const Camera2DControls_1 = require("./components/Camera2DControls");
const Camera3DControls_1 = require("./components/Camera3DControls");
const FlatColorRenderer_1 = require("./components/FlatColorRenderer");
const GridRenderer_1 = require("./components/GridRenderer");
const SelectionRenderer_1 = require("./components/SelectionRenderer");
const Camera_1 = require("./components/Camera");
exports.editorComponentClasses = {
    Camera2DControls: Camera2DControls_1.default, Camera3DControls: Camera3DControls_1.default, FlatColorRenderer: FlatColorRenderer_1.default, GridRenderer: GridRenderer_1.default, SelectionRenderer: SelectionRenderer_1.default
};
function registerEditorComponentClass(name, componentClass) {
    if (exports.editorComponentClasses[name] != null) {
        console.error(`SupEngine.registerEditorComponent: Tried to register two or more classes named "${name}"`);
        return;
    }
    exports.editorComponentClasses[name] = componentClass;
}
exports.registerEditorComponentClass = registerEditorComponentClass;
exports.componentClasses = {
    /* Built-ins */ Camera: Camera_1.default
};
function registerComponentClass(name, plugin) {
    if (exports.componentClasses[name] != null) {
        console.error(`SupEngine.registerComponentClass: Tried to register two or more classes named "${name}"`);
        return;
    }
    exports.componentClasses[name] = plugin;
}
exports.registerComponentClass = registerComponentClass;
exports.earlyUpdateFunctions = {};
function registerEarlyUpdateFunction(name, callback) {
    if (exports.earlyUpdateFunctions[name] != null) {
        console.error(`SupEngine.registerEarlyUpdateFunction: Tried to register two or more functions named "${name}"`);
        return;
    }
    exports.earlyUpdateFunctions[name] = callback;
}
exports.registerEarlyUpdateFunction = registerEarlyUpdateFunction;
