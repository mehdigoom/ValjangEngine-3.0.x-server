"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ActorComponent {
    constructor(actor, typeName) {
        this.pendingForDestruction = false;
        this.actor = actor;
        this.typeName = typeName;
        this.actor.components.push(this);
        this.actor.gameInstance.componentsToBeStarted.push(this);
    }
    _destroy() {
        const outer = this.__outer;
        if (outer != null)
            outer.__inner = null;
        const startIndex = this.actor.gameInstance.componentsToBeStarted.indexOf(this);
        if (startIndex !== -1)
            this.actor.gameInstance.componentsToBeStarted.splice(startIndex, 1);
        const index = this.actor.components.indexOf(this);
        if (index !== -1)
            this.actor.components.splice(index, 1);
        this.actor = null;
    }
    awake() { }
    start() { }
    update() { }
}
exports.default = ActorComponent;
