"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ListById_1 = require("./Base/ListById");
const _ = require("lodash");
const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
class Projects extends ListById_1.default {
    constructor(pub) {
        super(pub, Projects.schema);
        this.generateProjectId = () => {
            let id = null;
            while (true) {
                id = "";
                for (let i = 0; i < 4; i++)
                    id += _.sample(characters);
                if (this.byId[id] == null)
                    break;
            }
            return id;
        };
        this.generateNextId = this.generateProjectId;
    }
    static sort(a, b) {
        return a.name.localeCompare(b.name);
    }
}
Projects.schema = {
    name: { type: "string", minLength: 1, maxLength: 80 },
    description: { type: "string", maxLength: 300 },
    formatVersion: { type: "number?" },
    systemId: { type: "string" }
};
exports.default = Projects;
