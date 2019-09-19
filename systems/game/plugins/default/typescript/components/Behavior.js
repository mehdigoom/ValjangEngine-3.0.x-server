"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Behavior extends SupEngine.ActorComponent {
    constructor(actor, funcs) {
        super(actor, "Behavior");
        this.funcs = funcs;
    }
    awake() { if (this.funcs.awake != null)
        this.funcs.awake(); }
    start() { if (this.funcs.start != null)
        this.funcs.start(); }
    update() { if (this.funcs.update != null)
        this.funcs.update(); }
    _destroy() {
        if (this.funcs.onDestroy != null)
            this.funcs.onDestroy();
        this.funcs = null;
        super._destroy();
    }
    setIsLayerActive(active) { }
}
exports.default = Behavior;
