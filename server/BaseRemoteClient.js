"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AsyncLock = require("async-lock");
class BaseRemoteClient {
    constructor(server, socket) {
        this.server = server;
        this.socket = socket;
        this.subscriptions = [];
        this.lock = new AsyncLock();
        /*
        _error(message: string) {
          this.socket.emit("error", message);
          this.socket.disconnect();
        }
        */
        this.onDisconnect = () => {
            for (const subscription of this.subscriptions) {
                const [, endpoint, id] = subscription.split(":");
                if (id == null)
                    continue;
                this.server.data[endpoint].release(id, this);
            }
            this.server.removeRemoteClient(this.socket.id);
        };
        this.onSubscribe = (endpoint, id, callback) => {
            const roomName = ((id != null) ? `sub:${endpoint}:${id}` : `sub:${endpoint}`);
            this.lock.acquire(roomName, (unlockRoom) => {
                const data = this.server.data[endpoint];
                if (data == null) {
                    callback("No such endpoint");
                    unlockRoom();
                    return;
                }
                if (this.subscriptions.indexOf(roomName) !== -1) {
                    callback(`You're already subscribed to ${id}`);
                    return;
                }
                if (id == null) {
                    this.socket.join(roomName);
                    this.subscriptions.push(roomName);
                    const pub = data.pub;
                    const optionalArg = endpoint === "entries" ? data.nextId : null;
                    callback(null, pub, optionalArg);
                    unlockRoom();
                    return;
                }
                data.acquire(id, this, (err, item) => {
                    if (err != null) {
                        callback(`Could not acquire item: ${err}`, null);
                        unlockRoom();
                        return;
                    }
                    this.socket.join(roomName);
                    this.subscriptions.push(roomName);
                    callback(null, item.pub);
                    unlockRoom();
                    return;
                });
            });
        };
        this.onUnsubscribe = (endpoint, id) => {
            const data = this.server.data[endpoint];
            if (data == null)
                return;
            const roomName = ((id != null) ? `sub:${endpoint}:${id}` : `sub:${endpoint}`);
            this.lock.acquire(roomName, (unlockRoom) => {
                const index = this.subscriptions.indexOf(roomName);
                if (index === -1)
                    return;
                if (id != null) {
                    data.release(id, this);
                }
                this.socket.leave(roomName);
                this.subscriptions.splice(index, 1);
                unlockRoom();
            });
        };
        this.socket.on("error", (err) => { SupCore.log(err.stack); });
        this.socket.on("disconnect", this.onDisconnect);
        this.socket.on("sub", this.onSubscribe);
        this.socket.on("unsub", this.onUnsubscribe);
    }
    errorIfCant(action, callback) {
        if (!this.can(action)) {
            if (callback != null)
                callback("Forbidden");
            return false;
        }
        return true;
    }
    can(action) { throw new Error("BaseRemoteClient.can() must be overridden"); }
}
exports.default = BaseRemoteClient;
