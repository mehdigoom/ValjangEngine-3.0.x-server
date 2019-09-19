"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const THREE = SupEngine.THREE;
class CannonBody extends SupEngine.ActorComponent {
    constructor(actor) {
        super(actor, "CannonBody");
        this.actorPosition = new THREE.Vector3();
        this.actorOrientation = new THREE.Quaternion();
        this.body = new window.CANNON.Body();
        SupEngine.Cannon.World.addBody(this.body);
    }
    setIsLayerActive(active) { }
    setup(config) {
        this.mass = config.mass != null ? config.mass : 0;
        this.fixedRotation = config.fixedRotation != null ? config.fixedRotation : false;
        this.positionOffset = config.positionOffset != null ? config.positionOffset : { x: 0, y: 0, z: 0 };
        this.group = config.group != null ? config.group : 1;
        this.mask = config.mask != null ? config.mask : 1;
        this.actor.getGlobalPosition(this.actorPosition);
        this.actor.getGlobalOrientation(this.actorOrientation);
        this.body.mass = this.mass;
        this.body.type = this.mass === 0 ? window.CANNON.Body.STATIC : window.CANNON.Body.DYNAMIC;
        this.body.material = SupEngine.Cannon.World.defaultMaterial;
        this.body.fixedRotation = this.fixedRotation;
        this.body.collisionFilterGroup = this.group;
        this.body.collisionFilterMask = this.mask;
        this.body.updateMassProperties();
        if (config.orientationOffset != null) {
            this.orientationOffset = {
                x: THREE.Math.degToRad(config.orientationOffset.x),
                y: THREE.Math.degToRad(config.orientationOffset.y),
                z: THREE.Math.degToRad(config.orientationOffset.z)
            };
        }
        else {
            this.orientationOffset = { x: 0, y: 0, z: 0 };
        }
        this.shape = config.shape;
        switch (this.shape) {
            case "box":
                this.halfSize = config.halfSize != null ? config.halfSize : { x: 0.5, y: 0.5, z: 0.5 };
                this.body.addShape(new window.CANNON.Box(new window.CANNON.Vec3().copy(this.halfSize)));
                break;
            case "sphere":
                this.radius = config.radius != null ? config.radius : 1;
                this.body.addShape(new window.CANNON.Sphere(this.radius));
                break;
            case "cylinder":
                this.radius = config.radius != null ? config.radius : 1;
                this.height = config.height != null ? config.height : 1;
                this.segments = config.segments != null ? config.segments : 16;
                this.body.addShape(new window.CANNON.Cylinder(this.radius, this.radius, this.height, this.segments));
                break;
        }
        this.body.position.set(this.actorPosition.x, this.actorPosition.y, this.actorPosition.z);
        this.body.shapeOffsets[0].copy(this.positionOffset);
        this.body.shapeOrientations[0].setFromEuler(this.orientationOffset.x, this.orientationOffset.y, this.orientationOffset.z);
        this.body.quaternion.set(this.actorOrientation.x, this.actorOrientation.y, this.actorOrientation.z, this.actorOrientation.w);
    }
    update() {
        this.actorPosition.set(this.body.position.x, this.body.position.y, this.body.position.z);
        this.actor.setGlobalPosition(this.actorPosition);
        this.actorOrientation.set(this.body.quaternion.x, this.body.quaternion.y, this.body.quaternion.z, this.body.quaternion.w);
        this.actor.setGlobalOrientation(this.actorOrientation);
    }
    _destroy() {
        SupEngine.Cannon.World.remove(this.body);
        this.body = null;
        super._destroy();
    }
}
exports.default = CannonBody;
