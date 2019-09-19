"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SupData = require("./index");
const path = require("path");
const roomRegex = /^[A-Za-z0-9_]{1,20}$/;
class Rooms extends SupData.Base.Dictionary {
    constructor(server) {
        super();
        this.server = server;
    }
    acquire(id, owner, callback) {
        if (!roomRegex.test(id)) {
            callback(new Error(`Invalid room id: ${id}`));
            return;
        }
        super.acquire(id, owner, (err, item) => {
            if (err != null) {
                callback(err);
                return;
            }
            if (owner == null) {
                callback(null, item);
                return;
            }
            item.join(owner, (err, roomUser, index) => {
                if (err != null) {
                    callback(new Error(err));
                    return;
                }
                this.server.io.in(`sub:rooms:${id}`).emit("edit:rooms", id, "join", roomUser, index);
                callback(null, item);
            });
        });
    }
    release(id, owner, options) {
        super.release(id, owner, options);
        if (owner == null)
            return;
        this.byId[id].leave(owner, (err, roomUserId) => {
            if (err != null)
                throw new Error(err);
            this.server.io.in(`sub:rooms:${id}`).emit("edit:rooms", id, "leave", roomUserId);
        });
    }
    _load(id) {
        const room = new SupData.Room(null);
        room.load(path.join(this.server.projectPath, `rooms/${id}`));
        return room;
    }
}
exports.default = Rooms;
