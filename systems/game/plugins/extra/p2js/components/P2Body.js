"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const THREE = SupEngine.THREE;
class P2Body extends SupEngine.ActorComponent {
    constructor(actor) {
        super(actor, "P2Body");
        this.actorPosition = new THREE.Vector3();
        this.actorAngles = new THREE.Euler();
        this.body = new window.p2.Body();
        SupEngine.P2.world.addBody(this.body);
    }
    setIsLayerActive(active) { }
    setup(config) {
        this.mass = (config.mass != null) ? config.mass : 0;
        this.fixedRotation = (config.fixedRotation != null) ? config.fixedRotation : false;
        this.offsetX = (config.offsetX != null) ? config.offsetX : 0;
        this.offsetY = (config.offsetY != null) ? config.offsetY : 0;
        this.actor.getGlobalPosition(this.actorPosition);
        this.actor.getGlobalEulerAngles(this.actorAngles);
        this.body.mass = this.mass;
        this.body.type = (this.mass === 0) ? window.p2.Body.STATIC : window.p2.Body.DYNAMIC;
        this.body.material = SupEngine.P2.world.defaultMaterial;
        this.body.fixedRotation = this.fixedRotation;
        this.body.updateMassProperties();
        this.shape = config.shape;
        switch (this.shape) {
            case "box":
                {
                    this.width = (config.width != null) ? config.width : 0.5;
                    this.height = (config.height != null) ? config.height : 0.5;
                    this.angle = (config.angle != null) ? config.angle * (Math.PI / 180) : 0;
                    this.body.addShape(new window.p2.Box({ width: this.width, height: this.height }));
                }
                break;
            case "circle":
                {
                    this.radius = (config.radius != null) ? config.radius : 1;
                    this.angle = 0;
                    this.body.addShape(new window.p2.Circle({ radius: this.radius }));
                }
                break;
        }
        this.body.position = [this.actorPosition.x, this.actorPosition.y];
        this.body.shapes[0].position = [this.offsetX, this.offsetY];
        this.body.angle = this.actorAngles.z + this.angle;
    }
    update() {
        this.actorPosition.x = this.body.position[0];
        this.actorPosition.y = this.body.position[1];
        this.actor.setGlobalPosition(this.actorPosition);
        this.actorAngles.z = this.body.angle - this.angle;
        this.actor.setGlobalEulerAngles(this.actorAngles);
    }
    _destroy() {
        SupEngine.P2.world.removeBody(this.body);
        this.body = null;
        super._destroy();
    }
}
exports.default = P2Body;
