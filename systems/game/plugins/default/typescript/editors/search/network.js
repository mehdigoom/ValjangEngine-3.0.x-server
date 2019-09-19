"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ui_1 = require("./ui");
exports.data = {};
SupClient.i18n.load([{ root: `${window.location.pathname}/../..`, name: "searchEditor" }], () => {
    exports.socket = SupClient.connect(SupClient.query.project);
    exports.socket.on("connect", onConnected);
    exports.socket.on("disconnect", SupClient.onDisconnected);
});
const scriptSubscriber = {
    onAssetReceived: (err, asset) => {
        exports.data.assetsById[asset.id] = asset;
        ui_1.searchAsset(asset.id);
    },
    onAssetEdited: (id, command, ...args) => {
        if (command === "editText")
            ui_1.searchAsset(id);
    },
    onAssetTrashed: (id) => { },
};
const entriesSubscriber = {
    onEntriesReceived: (entries) => {
        entries.walk((entry) => {
            if (entry.type !== "script")
                return;
            exports.data.projectClient.subAsset(entry.id, "script", scriptSubscriber);
        });
    },
    onEntryAdded: (newEntry, parentId, index) => {
        if (newEntry.type !== "script")
            return;
        exports.data.projectClient.subAsset(newEntry.id, "script", scriptSubscriber);
    },
    onEntryMoved: (id, parentId, index) => {
        const entry = exports.data.projectClient.entries.byId[id];
        if (entry.type !== "script")
            return;
        const nameElt = document.querySelector(`span[data-id='${id}']`);
        if (nameElt != null) {
            const tableElt = document.querySelector(`table[data-id='${id}']`);
            const name = exports.data.projectClient.entries.getPathFromId(id);
            ui_1.refreshFileStatus(name, nameElt, tableElt.children.length);
        }
    },
    onSetEntryProperty: (id, key, value) => {
        const entry = exports.data.projectClient.entries.byId[id];
        if (entry.type !== "script" || key !== "name")
            return;
        const nameElt = document.querySelector(`span[data-id='${id}']`);
        if (nameElt != null) {
            const tableElt = document.querySelector(`table[data-id='${id}']`);
            const name = exports.data.projectClient.entries.getPathFromId(id);
            ui_1.refreshFileStatus(name, nameElt, tableElt.children.length);
        }
    },
    onEntryTrashed: (id) => {
        if (exports.data.assetsById[id] != null)
            delete exports.data.assetsById[id];
        const nameElt = document.querySelector(`span[data-id='${id}']`);
        const tableElt = document.querySelector(`table[data-id='${id}']`);
        if (nameElt != null)
            nameElt.parentElement.removeChild(nameElt);
        if (tableElt != null)
            tableElt.parentElement.removeChild(tableElt);
    },
};
function onConnected() {
    exports.data.assetsById = {};
    exports.data.projectClient = new SupClient.ProjectClient(exports.socket);
    exports.data.projectClient.subEntries(entriesSubscriber);
}
