"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ListById_1 = require("./Base/ListById");
class Badges extends ListById_1.default {
    constructor(pub) {
        super(pub, Badges.schema);
    }
}
Badges.schema = {
    id: { type: "string" },
    type: { type: "string" },
    data: { type: "any" }
};
exports.default = Badges;
