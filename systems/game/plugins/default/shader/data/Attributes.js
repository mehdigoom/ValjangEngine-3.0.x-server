"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Attributes extends SupCore.Data.Base.ListById {
    constructor(pub) {
        super(pub, Attributes.schema);
    }
}
Attributes.schema = {
    name: { type: "string", minLength: 1, maxLength: 80, mutable: true },
    type: { type: "enum", items: ["f", "c", "v2", "v3", "v4"], mutable: true }
};
exports.default = Attributes;
