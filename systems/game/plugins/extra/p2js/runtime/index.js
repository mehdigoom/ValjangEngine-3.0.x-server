"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// FIXME: import * p2 from "p2";
/* tslint:disable */
const p2 = require("p2");
/* tslint:enable */
window.p2 = p2;
var P2;
(function (P2) {
    "use strict";
    P2.world = new p2.World();
    P2.autoUpdate = true;
})(P2 || (P2 = {}));
SupEngine.P2 = P2;
SupEngine.registerEarlyUpdateFunction("P2js", (gameInstance) => {
    if (!P2.autoUpdate)
        return;
    P2.world.step(1 / gameInstance.framesPerSecond);
});
const P2Body = require("./P2Body");
SupRuntime.registerPlugin("P2Body", P2Body);
