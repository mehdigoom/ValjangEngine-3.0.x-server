"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SceneUpdater_1 = require("./SceneUpdater");
class SceneComponent extends SupEngine.ActorComponent {
    /* tslint:enable:variable-name */
    constructor(actor) {
        super(actor, "Scene");
    }
    setIsLayerActive(active) { }
}
/* tslint:disable:variable-name */
SceneComponent.Updater = SceneUpdater_1.default;
exports.default = SceneComponent;
