"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Base = require("./Base");
exports.Base = Base;
const Projects_1 = require("./Projects");
exports.Projects = Projects_1.default;
const ProjectManifest_1 = require("./ProjectManifest");
exports.ProjectManifest = ProjectManifest_1.default;
const Badges_1 = require("./Badges");
exports.Badges = Badges_1.default;
const Entries_1 = require("./Entries");
exports.Entries = Entries_1.default;
const Assets_1 = require("./Assets");
exports.Assets = Assets_1.default;
const Resources_1 = require("./Resources");
exports.Resources = Resources_1.default;
const Rooms_1 = require("./Rooms");
exports.Rooms = Rooms_1.default;
const Room_1 = require("./Room");
exports.Room = Room_1.default;
const RoomUsers_1 = require("./RoomUsers");
exports.RoomUsers = RoomUsers_1.default;
function hasDuplicateName(id, name, siblings) {
    for (const sibling of siblings) {
        if (sibling.id !== id && sibling.name === name)
            return true;
    }
    return false;
}
exports.hasDuplicateName = hasDuplicateName;
function ensureUniqueName(id, name, siblings) {
    name = name.trim();
    let candidateName = name;
    let nameNumber = 1;
    // Look for an already exiting number at the end of the name
    const matches = name.match(/\d+$/);
    if (matches != null) {
        name = name.substring(0, name.length - matches[0].length);
        nameNumber = parseInt(matches[0], 10);
    }
    while (hasDuplicateName(id, candidateName, siblings))
        candidateName = `${name}${++nameNumber}`;
    return candidateName;
}
exports.ensureUniqueName = ensureUniqueName;
