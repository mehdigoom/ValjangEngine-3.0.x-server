"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BehaviorUpdater_1 = require("./BehaviorUpdater");
class BehaviorMarker extends SupEngine.ActorComponent {
    /* tslint:enable:variable-name */
    constructor(actor) {
        super(actor, "BehaviorMarker");
    }
    setIsLayerActive(active) { }
}
/* tslint:disable:variable-name */
BehaviorMarker.Updater = BehaviorUpdater_1.default;
exports.default = BehaviorMarker;
