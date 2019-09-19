(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const THREE = SupEngine.THREE;
const tmpVector3 = new THREE.Vector3();
class ArcadeBody2D extends SupEngine.ActorComponent {
    constructor(actor, type) {
        super(actor, "ArcadeBody2D");
        this.enabled = true;
        this.movable = false;
        this.width = 1;
        this.height = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        this.bounceX = 0;
        this.bounceY = 0;
        this.layersIndex = [];
        this.customGravity = { x: null, y: null };
        this.touches = { top: false, bottom: false, right: false, left: false };
        SupEngine.ArcadePhysics2D.allBodies.push(this);
    }
    setIsLayerActive(active) { }
    setupBox(config) {
        this.type = "box";
        this.movable = config.movable;
        this.width = config.width;
        this.height = config.height;
        if (config.offset != null) {
            this.offsetX = config.offset.x;
            this.offsetY = config.offset.y;
        }
        if (config.bounce != null) {
            this.bounceX = config.bounce.x;
            this.bounceY = config.bounce.y;
        }
        this.actorPosition = this.actor.getGlobalPosition(new THREE.Vector3());
        this.position = this.actorPosition.clone();
        this.position.x += this.offsetX;
        this.position.y += this.offsetY;
        this.previousPosition = this.position.clone();
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.velocityMin = new THREE.Vector3(-Infinity, -Infinity, -Infinity);
        this.velocityMax = new THREE.Vector3(Infinity, Infinity, Infinity);
        this.velocityMultiplier = new THREE.Vector3(1, 1, 1);
    }
    setupTileMap(config) {
        this.type = "tileMap";
        this.tileMapAsset = config.tileMapAsset;
        this.tileSetAsset = config.tileSetAsset;
        this.mapToSceneFactor = {
            x: this.tileSetAsset.__inner.data.grid.width / this.tileMapAsset.__inner.data.pixelsPerUnit,
            y: this.tileSetAsset.__inner.data.grid.height / this.tileMapAsset.__inner.data.pixelsPerUnit,
        };
        this.tileSetPropertyName = config.tileSetPropertyName;
        if (config.layersIndex != null) {
            const layers = config.layersIndex.split(",");
            for (const layer of layers)
                this.layersIndex.push(parseInt(layer.trim(), 10));
        }
        else {
            for (let i = 0; i < this.tileMapAsset.__inner.data.layers.length; i++)
                this.layersIndex.push(i);
        }
        this.position = this.actor.getGlobalPosition(new THREE.Vector3());
    }
    earlyUpdate() {
        if (this.type === "tileMap")
            return;
        this.previousPosition.copy(this.position);
        if (!this.movable || !this.enabled)
            return;
        this.velocity.x += this.customGravity.x != null ? this.customGravity.x : SupEngine.ArcadePhysics2D.gravity.x;
        this.velocity.x *= this.velocityMultiplier.x;
        this.velocity.x = Math.min(Math.max(this.velocity.x, this.velocityMin.x), this.velocityMax.x);
        this.velocity.y += this.customGravity.y != null ? this.customGravity.y : SupEngine.ArcadePhysics2D.gravity.y;
        this.velocity.y *= this.velocityMultiplier.y;
        this.velocity.y = Math.min(Math.max(this.velocity.y, this.velocityMin.y), this.velocityMax.y);
        this.position.add(this.velocity);
        this.refreshActorPosition();
    }
    warpPosition(x, y) {
        this.position.x = x + this.offsetX;
        this.position.y = y + this.offsetY;
        this.refreshActorPosition();
    }
    refreshActorPosition() {
        this.actor.getGlobalPosition(this.actorPosition);
        this.actorPosition.x = this.position.x - this.offsetX;
        this.actorPosition.y = this.position.y - this.offsetY;
        this.actor.setGlobalPosition(tmpVector3.copy(this.actorPosition));
    }
    _destroy() {
        SupEngine.ArcadePhysics2D.allBodies.splice(SupEngine.ArcadePhysics2D.allBodies.indexOf(this), 1);
        super._destroy();
    }
    right() { return this.position.x + this.width / 2; }
    left() { return this.position.x - this.width / 2; }
    top() { return this.position.y + this.height / 2; }
    bottom() { return this.position.y - this.height / 2; }
    deltaX() { return this.position.x - this.previousPosition.x; }
    deltaY() { return this.position.y - this.previousPosition.y; }
}
exports.default = ArcadeBody2D;

},{}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ArcadeBody2DUpdater_1 = require("./ArcadeBody2DUpdater");
const THREE = SupEngine.THREE;
const tmpVector3 = new THREE.Vector3();
class ArcadeBody2DMarker extends SupEngine.ActorComponent {
    constructor(actor) {
        super(actor, "ArcadeBody2DMarker");
        this.offset = new THREE.Vector3(0, 0, 0);
        this.markerActor = new SupEngine.Actor(this.actor.gameInstance, `Marker`, null, { layer: -1 });
    }
    setIsLayerActive(active) {
        if (this.line != null)
            this.line.visible = active;
    }
    update() {
        super.update();
        this.markerActor.setGlobalPosition(this.actor.getGlobalPosition(tmpVector3));
    }
    setBox(width, height) {
        if (this.line != null)
            this._clearRenderer();
        const geometry = new THREE.Geometry();
        geometry.vertices.push(new THREE.Vector3(-width / 2, -height / 2, 0.01), new THREE.Vector3(width / 2, -height / 2, 0.01), new THREE.Vector3(width / 2, height / 2, 0.01), new THREE.Vector3(-width / 2, height / 2, 0.01), new THREE.Vector3(-width / 2, -height / 2, 0.01));
        const material = new THREE.LineBasicMaterial({ color: 0xf459e4 });
        this.line = new THREE.Line(geometry, material);
        this.markerActor.threeObject.add(this.line);
        this.setOffset();
    }
    setOffset(x, y) {
        if (x != null && y != null)
            this.offset.set(x, y, 0);
        this.line.position.set(this.offset.x, this.offset.y, 0);
        this.line.updateMatrixWorld(false);
    }
    setTileMap() {
        if (this.line != null)
            this._clearRenderer();
        // TODO ?
    }
    _clearRenderer() {
        this.markerActor.threeObject.remove(this.line);
        this.line.geometry.dispose();
        this.line.material.dispose();
        this.line = null;
    }
    _destroy() {
        if (this.line != null)
            this._clearRenderer();
        this.actor.gameInstance.destroyActor(this.markerActor);
        this.markerActor = null;
        super._destroy();
    }
}
/* tslint:disable:variable-name */
ArcadeBody2DMarker.Updater = ArcadeBody2DUpdater_1.default;
exports.default = ArcadeBody2DMarker;

},{"./ArcadeBody2DUpdater":3}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ArcadeBody2DUpdater {
    constructor(projectClient, bodyRenderer, config) {
        this.projectClient = projectClient;
        this.bodyRenderer = bodyRenderer;
        this.config = config;
        this.setType();
    }
    destroy() { }
    config_setProperty(path, value) {
        if (path === "width" || path === "height")
            this.bodyRenderer.setBox(this.config.width, this.config.height);
        if (path === "offset.x" || path === "offset.y")
            this.bodyRenderer.setOffset(this.config.offset.x, this.config.offset.y);
        if (path === "type")
            this.setType();
    }
    setType() {
        if (this.config.type === "box") {
            this.bodyRenderer.setBox(this.config.width, this.config.height);
            this.bodyRenderer.setOffset(this.config.offset.x, this.config.offset.y);
        }
        else
            this.bodyRenderer.setTileMap();
    }
}
exports.default = ArcadeBody2DUpdater;

},{}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const epsilon = 0.0001;
const THREE = SupEngine.THREE;
const ArcadeBody2D_1 = require("./ArcadeBody2D");
const ArcadeBody2DMarker_1 = require("./ArcadeBody2DMarker");
var ArcadePhysics2D;
(function (ArcadePhysics2D) {
    "use strict";
    ArcadePhysics2D.allBodies = [];
    ArcadePhysics2D.gravity = new THREE.Vector3(0, 0, 0);
    function intersects(body1, body2) {
        if (body2.type === "tileMap")
            return checkTileMap(body1, body2, { moveBody: false });
        if (body1.right() < body2.left())
            return false;
        if (body1.left() > body2.right())
            return false;
        if (body1.bottom() > body2.top())
            return false;
        if (body1.top() < body2.bottom())
            return false;
        return true;
    }
    ArcadePhysics2D.intersects = intersects;
    function detachFromBox(body1, body2) {
        let insideX = body1.position.x - body2.position.x;
        if (insideX >= 0)
            insideX -= (body1.width + body2.width) / 2;
        else
            insideX += (body1.width + body2.width) / 2;
        let insideY = body1.position.y - body2.position.y;
        if (insideY >= 0)
            insideY -= (body1.height + body2.height) / 2;
        else
            insideY += (body1.height + body2.height) / 2;
        if (Math.abs(insideY) <= Math.abs(insideX)) {
            if (body1.deltaY() / insideY > 0) {
                body1.velocity.y = -body1.velocity.y * body1.bounceY;
                body1.position.y -= insideY;
            }
            if (body1.position.y > body2.position.y)
                body1.touches.bottom = true;
            else
                body1.touches.top = true;
        }
        else {
            if (body1.deltaX() / insideX > 0) {
                body1.velocity.x = -body1.velocity.x * body1.bounceX;
                body1.position.x -= insideX;
            }
            if (body1.position.x > body2.position.x)
                body1.touches.left = true;
            else
                body1.touches.right = true;
        }
    }
    function checkTileMap(body1, body2, options) {
        function checkX() {
            const x = (body1.deltaX() < 0) ?
                Math.floor((body1.position.x - body2.position.x - body1.width / 2) / body2.mapToSceneFactor.x) :
                Math.floor((body1.position.x - body2.position.x + body1.width / 2 - epsilon) / body2.mapToSceneFactor.x);
            const y = body1.position.y - body2.position.y - body1.height / 2 + epsilon;
            const testedHeight = body1.height - 3 * epsilon;
            const totalPoints = Math.ceil(testedHeight / body2.mapToSceneFactor.y);
            for (let point = 0; point <= totalPoints; point++) {
                for (const layer of body2.layersIndex) {
                    const tile = body2.tileMapAsset.getTileAt(layer, x, Math.floor((y + point * testedHeight / totalPoints) / body2.mapToSceneFactor.y));
                    let collide = false;
                    if (body2.tileSetPropertyName != null)
                        collide = body2.tileSetAsset.getTileProperties(tile)[body2.tileSetPropertyName] != null;
                    else if (tile !== -1)
                        collide = true;
                    if (!collide)
                        continue;
                    if (options.moveBody) {
                        body1.velocity.x = -body1.velocity.x * body1.bounceX;
                        if (body1.deltaX() < 0) {
                            body1.position.x = (x + 1) * body2.mapToSceneFactor.x + body2.position.x + body1.width / 2;
                            body1.touches.left = true;
                        }
                        else {
                            body1.position.x = (x) * body2.mapToSceneFactor.x + body2.position.x - body1.width / 2;
                            body1.touches.right = true;
                        }
                    }
                    return true;
                }
            }
            return false;
        }
        function checkY() {
            const x = body1.position.x - body2.position.x - body1.width / 2 + epsilon;
            const y = (body1.deltaY() < 0) ?
                Math.floor((body1.position.y - body2.position.y - body1.height / 2) / body2.mapToSceneFactor.y) :
                Math.floor((body1.position.y - body2.position.y + body1.height / 2 - epsilon) / body2.mapToSceneFactor.y);
            const testedWidth = body1.width - 3 * epsilon;
            const totalPoints = Math.ceil(testedWidth / body2.mapToSceneFactor.x);
            for (let point = 0; point <= totalPoints; point++) {
                for (const layer of body2.layersIndex) {
                    const tile = body2.tileMapAsset.getTileAt(layer, Math.floor((x + point * testedWidth / totalPoints) / body2.mapToSceneFactor.x), y);
                    let collide = false;
                    if (body2.tileSetPropertyName != null)
                        collide = body2.tileSetAsset.getTileProperties(tile)[body2.tileSetPropertyName] != null;
                    else if (tile !== -1)
                        collide = true;
                    if (!collide)
                        continue;
                    if (options.moveBody) {
                        body1.velocity.y = -body1.velocity.y * body1.bounceY;
                        if (body1.deltaY() < 0) {
                            body1.position.y = (y + 1) * body2.mapToSceneFactor.y + body2.position.y + body1.height / 2;
                            body1.touches.bottom = true;
                        }
                        else {
                            body1.position.y = (y) * body2.mapToSceneFactor.y + body2.position.y - body1.height / 2;
                            body1.touches.top = true;
                        }
                    }
                    return true;
                }
            }
            return false;
        }
        const x = body1.position.x;
        body1.position.x = body1.previousPosition.x;
        let gotCollision = false;
        if (checkY())
            gotCollision = true;
        body1.position.x = x;
        if (checkX())
            gotCollision = true;
        return gotCollision;
    }
    function collides(body1, bodies) {
        if (body1.type === "tileMap" || !body1.movable)
            throw new Error("The first body must be a movable box in ArcadePhysics2D.collides");
        body1.touches.top = false;
        body1.touches.bottom = false;
        body1.touches.right = false;
        body1.touches.left = false;
        if (!body1.enabled)
            return false;
        let gotCollision = false;
        for (const body2 of bodies) {
            if (body2 === body1 || !body2.enabled)
                continue;
            if (body2.type === "box") {
                if (intersects(body1, body2)) {
                    gotCollision = true;
                    detachFromBox(body1, body2);
                }
            }
            else if (body2.type === "tileMap") {
                if (checkTileMap(body1, body2, { moveBody: true }))
                    gotCollision = true;
            }
        }
        if (gotCollision)
            body1.refreshActorPosition();
        return gotCollision;
    }
    ArcadePhysics2D.collides = collides;
})(ArcadePhysics2D || (ArcadePhysics2D = {}));
SupEngine.ArcadePhysics2D = ArcadePhysics2D;
SupEngine.registerEarlyUpdateFunction("ArcadePhysics2D", () => {
    for (const body of ArcadePhysics2D.allBodies)
        body.earlyUpdate();
});
SupEngine.registerComponentClass("ArcadeBody2D", ArcadeBody2D_1.default);
SupEngine.registerEditorComponentClass("ArcadeBody2DMarker", ArcadeBody2DMarker_1.default);

},{"./ArcadeBody2D":1,"./ArcadeBody2DMarker":2}]},{},[4]);
