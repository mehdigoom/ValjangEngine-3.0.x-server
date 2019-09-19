"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const storageKey = "superpowers.common.textEditorWidget";
const item = window.localStorage.getItem(storageKey);
exports.pub = item != null ? JSON.parse(item) : {
    formatVersion: 2,
    keyMap: "sublime",
    theme: "default"
};
if (exports.pub.formatVersion === 1) {
    exports.pub.formatVersion = 2;
    edit("theme", "default");
}
exports.emitter = new events_1.EventEmitter();
window.addEventListener("storage", (event) => {
    if (event.key !== storageKey)
        return;
    const oldPub = exports.pub;
    exports.pub = JSON.parse(event.newValue);
    if (oldPub.keyMap !== exports.pub.keyMap)
        exports.emitter.emit("keyMap");
    if (oldPub.theme !== exports.pub.theme)
        exports.emitter.emit("theme");
});
function edit(key, value) {
    exports.pub[key] = value;
    window.localStorage.setItem(storageKey, JSON.stringify(exports.pub));
}
exports.edit = edit;
