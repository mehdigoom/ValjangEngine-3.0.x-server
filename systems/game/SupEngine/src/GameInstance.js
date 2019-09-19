"use strict";
/// <reference path="../SupEngine.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const THREE = require("three");
const ActorTree_1 = require("./ActorTree");
const Input_1 = require("./Input");
const Audio_1 = require("./Audio");
class GameInstance extends events_1.EventEmitter {
    constructor(canvas, options = {}) {
        super();
        this.framesPerSecond = 60;
        this.layers = ["Default"];
        this.tree = new ActorTree_1.default();
        this.cachedActors = [];
        this.renderComponents = [];
        this.componentsToBeStarted = [];
        this.componentsToBeDestroyed = [];
        this.actorsToBeDestroyed = [];
        this.audio = new Audio_1.default();
        this.threeScene = new THREE.Scene();
        this.skipRendering = false;
        // Used to know whether or not we have to close the window at exit when using the app
        this.debug = options.debug === true;
        // Exit callback is only enabled when playing the actual game, not in most editors
        this.input = new Input_1.default(canvas, { enableOnExit: options.enableOnExit });
        // Setup layers
        if (options.layers != null)
            this.layers = options.layers;
        // NOTE: We ask for a stencil buffer because of a Firefox bug
        // If we don't, Firefox will often return a 16-bit depth buffer
        // (rather than a more useful 24-bit depth buffer).
        // See https://bugzilla.mozilla.org/show_bug.cgi?id=1202387
        try {
            this.threeRenderer = new THREE.WebGLRenderer({ canvas, precision: "mediump", alpha: false, antialias: false, stencil: true });
        }
        catch (e) {
            return;
        }
        this.threeRenderer.setSize(0, 0, false);
        this.threeRenderer.autoClearColor = false;
        this.threeScene.autoUpdate = false;
    }
    tick(accumulatedTime, callback) {
        const updateInterval = 1 / this.framesPerSecond * 1000;
        // Limit how many update()s to try and catch up,
        // to avoid falling into the "black pit of despair" aka "doom spiral".
        // where every tick takes longer than the previous one.
        // See http://blogs.msdn.com/b/shawnhar/archive/2011/03/25/technical-term-that-should-exist-quot-black-pit-of-despair-quot.aspx
        const maxAccumulatedUpdates = 5;
        const maxAccumulatedTime = maxAccumulatedUpdates * updateInterval;
        if (accumulatedTime > maxAccumulatedTime)
            accumulatedTime = maxAccumulatedTime;
        // Update
        let updates = 0;
        while (accumulatedTime >= updateInterval) {
            this.update();
            if (callback != null)
                callback();
            if (this.input.exited)
                break;
            accumulatedTime -= updateInterval;
            updates++;
        }
        return { updates, timeLeft: accumulatedTime };
    }
    update() {
        this.input.update();
        // Build cached actors list
        this.cachedActors.length = 0;
        this.tree.walkTopDown((actor) => { this.cachedActors.push(actor); return true; });
        // Start newly-added components
        let index = 0;
        while (index < this.componentsToBeStarted.length) {
            const component = this.componentsToBeStarted[index];
            // If the component to be started is part of an actor
            // which will not be updated, skip it until next loop
            if (this.cachedActors.indexOf(component.actor) === -1) {
                index++;
                continue;
            }
            component.start();
            this.componentsToBeStarted.splice(index, 1);
        }
        for (const pluginName in SupEngine.earlyUpdateFunctions)
            SupEngine.earlyUpdateFunctions[pluginName](this);
        // Update all actors
        this.cachedActors.forEach((actor) => { actor.update(); });
        // Apply pending component / actor destructions
        this.componentsToBeDestroyed.forEach((component) => { this._doComponentDestruction(component); });
        this.componentsToBeDestroyed.length = 0;
        this.actorsToBeDestroyed.forEach((actor) => { this._doActorDestruction(actor); });
        this.actorsToBeDestroyed.length = 0;
        if (this.input.exited) {
            this.threeRenderer.clear();
            return;
        }
        if (this.skipRendering) {
            this.skipRendering = false;
            this.update();
            return;
        }
    }
    setRatio(ratio) {
        this.ratio = ratio;
        if (this.ratio != null) {
            this.threeRenderer.domElement.style.margin = "auto";
            this.threeRenderer.domElement.style.flex = "none";
        }
        else {
            this.threeRenderer.domElement.style.margin = "0";
            this.threeRenderer.domElement.style.flex = "1";
        }
        this.resizeRenderer();
    }
    resizeRenderer() {
        let width;
        let height;
        if (this.ratio != null) {
            if (document.body.clientWidth / document.body.clientHeight > this.ratio) {
                height = document.body.clientHeight;
                width = Math.min(document.body.clientWidth, height * this.ratio);
            }
            else {
                width = document.body.clientWidth;
                height = Math.min(document.body.clientHeight, width / this.ratio);
            }
        }
        else {
            width = this.threeRenderer.domElement.clientWidth;
            height = this.threeRenderer.domElement.clientHeight;
        }
        if (this.threeRenderer.domElement.width !== width || this.threeRenderer.domElement.height !== height) {
            this.threeRenderer.setSize(width, height, false);
            this.emit("resize", { width, height });
        }
    }
    setActiveLayer(layer) {
        for (const cachedActor of this.cachedActors)
            cachedActor.setActiveLayer(layer);
    }
    draw() {
        this.resizeRenderer();
        this.threeRenderer.clear();
        this.renderComponents.sort((a, b) => {
            let order = (a.depth - b.depth);
            if (order === 0)
                order = this.cachedActors.indexOf(a.actor) - this.cachedActors.indexOf(b.actor);
            return order;
        });
        for (const renderComponent of this.renderComponents)
            renderComponent.render();
    }
    clear() { this.threeRenderer.clear(); }
    destroyComponent(component) {
        if (component.pendingForDestruction)
            return;
        this.componentsToBeDestroyed.push(component);
        component.pendingForDestruction = true;
        const index = this.componentsToBeStarted.indexOf(component);
        if (index !== -1)
            this.componentsToBeStarted.splice(index, 1);
    }
    destroyActor(actor) {
        if (actor.pendingForDestruction)
            return;
        this.actorsToBeDestroyed.push(actor);
        actor._markDestructionPending();
    }
    destroyAllActors() {
        this.tree.walkTopDown((actor) => { this.destroyActor(actor); return true; });
        this.skipRendering = true;
    }
    _doComponentDestruction(component) { component._destroy(); }
    _doActorDestruction(actor) {
        while (actor.children.length > 0)
            this._doActorDestruction(actor.children[0]);
        const cachedIndex = this.cachedActors.indexOf(actor);
        if (cachedIndex !== -1)
            this.cachedActors.splice(cachedIndex, 1);
        actor._destroy();
    }
}
exports.default = GameInstance;
