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
