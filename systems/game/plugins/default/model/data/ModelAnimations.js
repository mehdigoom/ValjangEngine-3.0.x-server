"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ModelAnimations extends SupCore.Data.Base.ListById {
    constructor(pub) {
        super(pub, ModelAnimations.schema);
    }
}
ModelAnimations.schema = {
    name: { type: "string", minLength: 1, maxLength: 80, mutable: true },
    duration: { type: "number" },
    keyFrames: {
        type: "hash",
        keys: { minLength: 1, maxLength: 80 },
        values: {
            type: "hash",
            properties: {
                translation: {
                    type: "array?",
                    items: {
                        type: "hash",
                        properties: {
                            time: { type: "number", min: 0 },
                            value: { type: "array", items: { type: "number", length: 3 } }
                        }
                    }
                },
                rotation: {
                    type: "array?",
                    items: {
                        type: "hash",
                        properties: {
                            time: { type: "number", min: 0 },
                            value: { type: "array", items: { type: "number", length: 4 } }
                        }
                    }
                },
                scale: {
                    type: "array?",
                    items: {
                        type: "hash",
                        properties: {
                            time: { type: "number", min: 0 },
                            value: { type: "array", items: { type: "number", length: 3 } }
                        }
                    }
                }
            }
        }
    }
};
exports.default = ModelAnimations;
