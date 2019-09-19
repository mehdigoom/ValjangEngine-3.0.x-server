(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

},{}],2:[function(require,module,exports){
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

},{"./BehaviorUpdater":3}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class BehaviorUpdater {
    constructor(client, behavior, config) { }
    destroy() { }
}
exports.default = BehaviorUpdater;

},{}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Behavior_1 = require("./Behavior");
const BehaviorMarker_1 = require("./BehaviorMarker");
SupEngine.registerComponentClass("Behavior", Behavior_1.default);
SupEngine.registerEditorComponentClass("BehaviorMarker", BehaviorMarker_1.default);

},{"./Behavior":1,"./BehaviorMarker":2}]},{},[4]);
