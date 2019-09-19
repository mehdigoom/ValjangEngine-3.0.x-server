"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const THREE = require("three");
window.THREE = THREE;
THREE.Euler.DefaultOrder = "YXZ";
const Camera_1 = require("./Camera");
exports.Camera = Camera_1.default;
const Camera2DControls_1 = require("./Camera2DControls");
exports.Camera2DControls = Camera2DControls_1.default;
const Camera3DControls_1 = require("./Camera3DControls");
exports.Camera3DControls = Camera3DControls_1.default;
function createWebGLRenderer(params) {
    if (params == null)
        params = {};
    if (params.precision == null)
        params.precision = "mediump";
    if (params.alpha == null)
        params.alpha = false;
    if (params.antialias == null)
        params.antialias = false;
    // NOTE: We ask for a stencil buffer by default because of a Firefox bug:
    // Without it, Firefox will often return a 16-bit depth buffer
    // (rather than a more useful 24-bit depth buffer).
    // See https://bugzilla.mozilla.org/show_bug.cgi?id=1202387
    if (params.stencil == null)
        params.stencil = true;
    const renderer = new THREE.WebGLRenderer(params);
    return renderer;
}
exports.createWebGLRenderer = createWebGLRenderer;
class Ticker {
    constructor(tickCallback, options) {
        this.tickCallback = tickCallback;
        this.previousTimestamp = 0;
        this.accumulatedTime = 0;
        if (options == null)
            options = { timeStep: 1000 / 60, maxLateTicks: 5 };
        this.timeStep = options.timeStep;
        this.maxAccumulatedTime = options.maxLateTicks * options.timeStep;
    }
    tick(timestamp) {
        this.accumulatedTime += timestamp - this.previousTimestamp;
        this.previousTimestamp = timestamp;
        let ticks = 0;
        if (this.accumulatedTime > this.maxAccumulatedTime)
            this.accumulatedTime = this.maxAccumulatedTime;
        while (this.accumulatedTime >= this.timeStep) {
            if (this.tickCallback != null) {
                const keepGoing = this.tickCallback();
                if (!keepGoing)
                    break;
            }
            this.accumulatedTime -= this.timeStep;
            ticks++;
        }
        return ticks;
    }
    reset() {
        this.previousTimestamp = 0;
        this.accumulatedTime = 0;
    }
}
exports.Ticker = Ticker;
