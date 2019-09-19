"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ListById_1 = require("./Base/ListById");
class RoomUsers extends ListById_1.default {
    constructor(pub) {
        super(pub, RoomUsers.schema);
    }
}
RoomUsers.schema = {
    // TODO: use userId for id when we've got proper login
    id: { type: "string", minLength: 3, maxLength: 20 },
    connectionCount: { type: "number", min: 1 }
    // username: { type: "string", minLength: 3, maxLength: 20 }
};
exports.default = RoomUsers;
