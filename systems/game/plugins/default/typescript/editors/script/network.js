"use strict";
/// <reference path="../../typescriptAPI/TypeScriptAPIPlugin.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
const ui_1 = require("./ui");
const async = require("async");
exports.data = {
    clientId: null,
    projectClient: null,
    typescriptWorker: new Worker("typescriptWorker.js"),
    assetsById: {},
    asset: null,
    fileNames: [],
    files: {},
    fileNamesByScriptId: {}
};
SupClient.i18n.load([{ root: `${window.location.pathname}/../..`, name: "scriptEditor" }], () => {
    exports.socket = SupClient.connect(SupClient.query.project);
    exports.socket.on("welcome", onWelcome);
    exports.socket.on("disconnect", SupClient.onDisconnected);
});
const onAssetCommands = {};
onAssetCommands["editText"] = (operationData) => {
    ui_1.default.errorPaneStatus.classList.add("has-draft");
    ui_1.default.editor.receiveEditText(operationData);
};
onAssetCommands["applyDraftChanges"] = () => {
    ui_1.default.errorPaneStatus.classList.remove("has-draft");
};
let allScriptsReceived = false;
const scriptSubscriber = {
    onAssetReceived: (id, asset) => {
        exports.data.assetsById[id] = asset;
        const fileName = `${exports.data.projectClient.entries.getPathFromId(id)}.ts`;
        const file = { id: id, text: id === SupClient.query.asset ? asset.pub.draft : asset.pub.text, version: asset.pub.revisionId.toString() };
        exports.data.files[fileName] = file;
        if (id === SupClient.query.asset) {
            ui_1.setupEditor(exports.data.clientId);
            SupClient.setEntryRevisionDisabled(false);
            exports.data.asset = asset;
            ui_1.start(exports.data.asset);
        }
        if (!allScriptsReceived) {
            if (Object.keys(exports.data.files).length === exports.data.fileNames.length) {
                allScriptsReceived = true;
                exports.data.typescriptWorker.postMessage({ type: "setup", fileNames: exports.data.fileNames, files: exports.data.files });
                scheduleErrorCheck();
            }
        }
        else {
            // All scripts have been received so this must be a newly created script
            exports.data.typescriptWorker.postMessage({ type: "addFile", fileName, index: exports.data.fileNames.indexOf(fileName), file });
            scheduleErrorCheck();
        }
    },
    onAssetRestored: (id, asset) => {
        exports.data.assetsById[id] = asset;
        if (id === SupClient.query.asset) {
            exports.data.asset = asset;
            if (ui_1.default.selectedRevision === "current") {
                ui_1.start(exports.data.asset);
                updateWorkerFile(id, asset.pub.draft, asset.pub.revisionId.toString());
            }
        }
        else {
            updateWorkerFile(id, asset.pub.text, asset.pub.revisionId.toString());
        }
    },
    onAssetEdited: (id, command, ...args) => {
        if (id !== SupClient.query.asset) {
            if (command === "applyDraftChanges") {
                const fileName = `${exports.data.projectClient.entries.getPathFromId(id)}.ts`;
                const asset = exports.data.assetsById[id];
                const file = exports.data.files[fileName];
                file.text = asset.pub.text;
                file.version = asset.pub.revisionId.toString();
                exports.data.typescriptWorker.postMessage({ type: "updateFile", fileName, text: file.text, version: file.version });
                scheduleErrorCheck();
            }
            return;
        }
        if (ui_1.default.selectedRevision === "current" && onAssetCommands[command] != null)
            onAssetCommands[command].apply(exports.data.asset, args);
    },
    onAssetTrashed: (id) => {
        if (id !== SupClient.query.asset)
            return;
        ui_1.default.editor.clear();
        if (ui_1.default.errorCheckTimeout != null)
            clearTimeout(ui_1.default.errorCheckTimeout);
        if (ui_1.default.completionTimeout != null)
            clearTimeout(ui_1.default.completionTimeout);
        SupClient.onAssetTrashed();
    },
};
function updateWorkerFile(id, text, version) {
    const fileName = `${exports.data.projectClient.entries.getPathFromId(id)}.ts`;
    const file = exports.data.files[fileName];
    file.text = text;
    file.version = version;
    exports.data.typescriptWorker.postMessage({ type: "updateFile", fileName, text: file.text, version: file.version });
    scheduleErrorCheck();
}
exports.updateWorkerFile = updateWorkerFile;
const entriesSubscriber = {
    onEntriesReceived: (entries) => {
        entries.walk((entry) => {
            if (entry.type !== "script")
                return;
            const fileName = `${exports.data.projectClient.entries.getPathFromId(entry.id)}.ts`;
            exports.data.fileNames.push(fileName);
            exports.data.fileNamesByScriptId[entry.id] = fileName;
            exports.data.projectClient.subAsset(entry.id, "script", scriptSubscriber);
        });
    },
    onEntryAdded: (newEntry, parentId, index) => {
        if (newEntry.type !== "script")
            return;
        const fileName = `${exports.data.projectClient.entries.getPathFromId(newEntry.id)}.ts`;
        let i = 0;
        exports.data.projectClient.entries.walk((entry) => {
            if (entry.type !== "script")
                return;
            if (entry.id === newEntry.id)
                exports.data.fileNames.splice(i, 0, fileName);
            i++;
        });
        exports.data.fileNamesByScriptId[newEntry.id] = fileName;
        exports.data.projectClient.subAsset(newEntry.id, "script", scriptSubscriber);
    },
    onEntryMoved: (id, parentId, index) => {
        const entry = exports.data.projectClient.entries.byId[id];
        if (entry.type != null && entry.type !== "script")
            return;
        const renameFile = (entry) => {
            if (entry.type == null) {
                for (const child of entry.children)
                    renameFile(child);
            }
            else if (entry.type === "script") {
                const oldFileName = exports.data.fileNamesByScriptId[entry.id];
                const newFileName = `${exports.data.projectClient.entries.getPathFromId(entry.id)}.ts`;
                exports.data.fileNames.splice(exports.data.fileNames.indexOf(oldFileName), 1);
                let i = 0;
                exports.data.projectClient.entries.walk((nextEntry) => {
                    if (nextEntry.type !== "script")
                        return;
                    if (nextEntry.id === entry.id)
                        exports.data.fileNames.splice(i, 0, newFileName);
                    i++;
                });
                exports.data.fileNamesByScriptId[entry.id] = newFileName;
                const file = exports.data.files[oldFileName];
                exports.data.files[newFileName] = file;
                if (newFileName !== oldFileName)
                    delete exports.data.files[oldFileName];
                exports.data.typescriptWorker.postMessage({ type: "removeFile", fileName: oldFileName });
                exports.data.typescriptWorker.postMessage({ type: "addFile", fileName: newFileName, index: exports.data.fileNames.indexOf(newFileName), file });
            }
        };
        renameFile(entry);
        scheduleErrorCheck();
    },
    onSetEntryProperty: (id, key, value) => {
        const entry = exports.data.projectClient.entries.byId[id];
        if ((entry.type != null && entry.type !== "script") || key !== "name")
            return;
        const renameFile = (entry) => {
            if (entry.type == null) {
                for (const child of entry.children)
                    renameFile(child);
            }
            else if (entry.type === "script") {
                const oldFileName = exports.data.fileNamesByScriptId[entry.id];
                const newFileName = `${exports.data.projectClient.entries.getPathFromId(entry.id)}.ts`;
                if (newFileName === oldFileName)
                    return;
                const scriptIndex = exports.data.fileNames.indexOf(oldFileName);
                exports.data.fileNames[scriptIndex] = newFileName;
                exports.data.fileNamesByScriptId[entry.id] = newFileName;
                const file = exports.data.files[oldFileName];
                exports.data.files[newFileName] = file;
                delete exports.data.files[oldFileName];
                exports.data.typescriptWorker.postMessage({ type: "removeFile", fileName: oldFileName });
                exports.data.typescriptWorker.postMessage({ type: "addFile", fileName: newFileName, index: exports.data.fileNames.indexOf(newFileName), file });
            }
        };
        renameFile(entry);
        scheduleErrorCheck();
    },
    onEntryTrashed: (id) => {
        const fileName = exports.data.fileNamesByScriptId[id];
        if (fileName == null)
            return;
        exports.data.fileNames.splice(exports.data.fileNames.indexOf(fileName), 1);
        delete exports.data.files[fileName];
        delete exports.data.fileNamesByScriptId[id];
        exports.data.typescriptWorker.postMessage({ type: "removeFile", fileName });
        scheduleErrorCheck();
    },
};
let isCheckingForErrors = false;
let hasScheduledErrorCheck = false;
let activeCompletion;
let nextCompletion;
exports.data.typescriptWorker.onmessage = (event) => {
    switch (event.data.type) {
        case "errors":
            ui_1.refreshErrors(event.data.errors);
            isCheckingForErrors = false;
            if (hasScheduledErrorCheck)
                startErrorCheck();
            break;
        case "completion":
            if (nextCompletion != null) {
                activeCompletion = null;
                startAutocomplete();
                return;
            }
            for (const item of event.data.list) {
                item.render = (parentElt, data, item) => {
                    parentElt.style.maxWidth = "100em";
                    const rowElement = document.createElement("div");
                    rowElement.style.display = "flex";
                    parentElt.appendChild(rowElement);
                    const kindElement = document.createElement("div");
                    kindElement.style.marginRight = "0.5em";
                    kindElement.style.width = "6em";
                    kindElement.textContent = item.kind;
                    rowElement.appendChild(kindElement);
                    const nameElement = document.createElement("div");
                    nameElement.style.marginRight = "0.5em";
                    nameElement.style.width = "15em";
                    nameElement.style.fontWeight = "bold";
                    nameElement.textContent = item.name;
                    rowElement.appendChild(nameElement);
                    const infoElement = document.createElement("div");
                    infoElement.textContent = item.info;
                    rowElement.appendChild(infoElement);
                };
            }
            const from = { line: activeCompletion.cursor.line, ch: activeCompletion.token.start };
            const to = { line: activeCompletion.cursor.line, ch: activeCompletion.token.end };
            activeCompletion.callback({ list: event.data.list, from, to });
            activeCompletion = null;
            break;
        case "quickInfo":
            if (ui_1.default.infoTimeout == null) {
                ui_1.default.infoElement.textContent = event.data.text;
                ui_1.default.editor.codeMirrorInstance.addWidget(ui_1.default.infoPosition, ui_1.default.infoElement, false);
            }
            break;
        case "parameterHint":
            ui_1.clearParameterPopup();
            if (event.data.texts != null)
                ui_1.showParameterPopup(event.data.texts, event.data.selectedItemIndex, event.data.selectedArgumentIndex);
            break;
        case "definition":
            if (window.parent != null) {
                const entry = SupClient.findEntryByPath(exports.data.projectClient.entries.pub, event.data.fileName);
                SupClient.openEntry(entry.id, { line: event.data.line, ch: event.data.ch });
            }
            break;
    }
};
let isTabActive = true;
let errorCheckPending = false;
window.addEventListener("message", (event) => {
    if (event.data.type === "deactivate" || event.data.type === "activate") {
        isTabActive = event.data.type === "activate";
        if (isTabActive && errorCheckPending)
            startErrorCheck();
    }
});
function startErrorCheck() {
    if (isCheckingForErrors)
        return;
    isCheckingForErrors = true;
    hasScheduledErrorCheck = false;
    errorCheckPending = false;
    exports.data.typescriptWorker.postMessage({ type: "checkForErrors" });
}
function scheduleErrorCheck() {
    if (ui_1.default.errorCheckTimeout != null)
        clearTimeout(ui_1.default.errorCheckTimeout);
    if (!isTabActive) {
        errorCheckPending = true;
        return;
    }
    ui_1.default.errorCheckTimeout = window.setTimeout(() => {
        hasScheduledErrorCheck = true;
        if (!isCheckingForErrors)
            startErrorCheck();
    }, 300);
}
exports.scheduleErrorCheck = scheduleErrorCheck;
function startAutocomplete() {
    if (activeCompletion != null)
        return;
    activeCompletion = nextCompletion;
    nextCompletion = null;
    exports.data.typescriptWorker.postMessage({
        type: "getCompletionAt",
        tokenString: activeCompletion.token.string,
        name: exports.data.fileNamesByScriptId[SupClient.query.asset],
        start: activeCompletion.start
    });
}
function setNextCompletion(completion) {
    nextCompletion = completion;
    if (activeCompletion == null)
        startAutocomplete();
}
exports.setNextCompletion = setNextCompletion;
function onWelcome(clientId) {
    exports.data.clientId = clientId;
    loadPlugins();
}
function loadPlugins() {
    SupClient.fetch(`/systems/${SupCore.system.id}/plugins.json`, "json", (err, pluginsInfo) => {
        async.each(pluginsInfo.list, (pluginName, cb) => {
            SupClient.loadScript(`/systems/${SupCore.system.id}/plugins/${pluginName}/bundles/typescriptAPI.js`, cb);
        }, (err) => {
            // Read API definitions
            let globalDefs = "";
            const actorComponentAccessors = [];
            const plugins = SupCore.system.getPlugins("typescriptAPI");
            for (const pluginName in plugins) {
                const plugin = plugins[pluginName];
                if (plugin.defs != null)
                    globalDefs += plugin.defs;
                if (plugin.exposeActorComponent != null)
                    actorComponentAccessors.push(`${plugin.exposeActorComponent.propertyName}: ${plugin.exposeActorComponent.className};`);
            }
            globalDefs = globalDefs.replace("// INSERT_COMPONENT_ACCESSORS", actorComponentAccessors.join("\n    "));
            exports.data.fileNames.push("lib.d.ts");
            exports.data.files["lib.d.ts"] = { id: "lib.d.ts", text: globalDefs, version: "" };
            exports.data.projectClient = new SupClient.ProjectClient(exports.socket);
            exports.data.projectClient.subEntries(entriesSubscriber);
        });
    });
}
