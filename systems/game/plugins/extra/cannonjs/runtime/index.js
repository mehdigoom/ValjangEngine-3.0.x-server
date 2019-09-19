"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// FIXME: import * cannon from "cannon";
/* tslint:disable */
const cannon = require("cannon");
/* tslint:enable */
const CannonBody = require("./CannonBody");
window.CANNON = cannon;
SupEngine.Cannon = {
    World: new window.CANNON.World(),
    autoUpdate: true
};
SupEngine.registerEarlyUpdateFunction("Cannonjs", (gameInstance) => {
    if (!SupEngine.Cannon.autoUpdate)
        return;
    SupEngine.Cannon.World.step(1 / gameInstance.framesPerSecond);
});
SupRuntime.registerPlugin("CannonBody", CannonBody);
