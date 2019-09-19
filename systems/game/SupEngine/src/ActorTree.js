"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ActorTree {
    constructor() {
        this.root = [];
    }
    _walkRecurseTopDown(node, parentNode, callback) {
        if (callback(node, parentNode) === false)
            return false;
        for (const child of node.children) {
            if (this._walkRecurseTopDown(child, node, callback) === false)
                return false;
        }
        return true;
    }
    walkTopDown(callback) {
        for (const child of this.root) {
            if (this._walkRecurseTopDown(child, null, callback) === false)
                return false;
        }
        return true;
    }
    walkDown(rootNode, callback) {
        for (const child of rootNode.children) {
            if (this._walkRecurseTopDown(child, rootNode, callback) === false)
                return false;
        }
        return true;
    }
}
exports.default = ActorTree;
