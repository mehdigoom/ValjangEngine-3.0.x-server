"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class SpriteAnimations extends SupCore.Data.Base.ListById {
    constructor(pub) {
        super(pub, SpriteAnimations.schema);
    }
}
SpriteAnimations.schema = {
    name: { type: "string", minLength: 1, maxLength: 80, mutable: true },
    startFrameIndex: { type: "number", min: 0, mutable: true },
    endFrameIndex: { type: "number", min: 0, mutable: true },
    speed: { type: "number", mutable: true }
};
exports.default = SpriteAnimations;
