"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const data = {};
const ui = {};
let socket = null;
function start() {
    socket = SupClient.connect(SupClient.query.project);
    socket.on("connect", onConnected);
    socket.on("disconnect", SupClient.onDisconnected);
    // Main
    ui.audioElt = document.querySelector("audio");
    // Upload
    const fileSelect = document.querySelector("input.file-select");
    fileSelect.addEventListener("change", onFileSelectChange);
    document.querySelector("button.upload").addEventListener("click", () => { fileSelect.click(); });
    document.querySelector("button.download").addEventListener("click", onDownloadSound);
    // Sidebar
    ui.streamingSelect = document.querySelector(".property-streaming");
    ui.streamingSelect.addEventListener("change", (event) => {
        data.projectClient.editAsset(SupClient.query.asset, "setProperty", "streaming", ui.streamingSelect.value === "true");
    });
}
// Network callbacks
const onAssetCommands = {};
function onConnected() {
    data.projectClient = new SupClient.ProjectClient(socket);
    const soundSubscriber = {
        onAssetReceived,
        onAssetEdited,
        onAssetTrashed: SupClient.onAssetTrashed
    };
    data.projectClient.subAsset(SupClient.query.asset, "sound", soundSubscriber);
}
function onAssetReceived(err, asset) {
    data.asset = asset;
    setupSound();
    setupProperty("streaming", data.asset.pub.streaming);
}
function onAssetEdited(id, command, ...args) {
    if (onAssetCommands[command] != null)
        onAssetCommands[command].apply(data.asset, args);
}
// User interface
let objectURL;
function onFileSelectChange(event) {
    if (event.target.files.length === 0)
        return;
    const reader = new FileReader();
    reader.onload = (event) => {
        data.projectClient.editAsset(SupClient.query.asset, "upload", reader.result);
    };
    reader.readAsArrayBuffer(event.target.files[0]);
    event.target.parentElement.reset();
}
function onDownloadSound() {
    function triggerDownload(name) {
        const anchor = document.createElement("a");
        document.body.appendChild(anchor);
        anchor.style.display = "none";
        anchor.href = objectURL;
        // Not yet supported in IE and Safari (http://caniuse.com/#feat=download)
        anchor.download = name;
        anchor.click();
        document.body.removeChild(anchor);
    }
    const options = {
        initialValue: SupClient.i18n.t("soundEditor:sidebar.settings.sound.file.download.defaultName"),
        validationLabel: SupClient.i18n.t("common:actions.download")
    };
    if (SupApp != null) {
        triggerDownload(options.initialValue);
    }
    else {
        new SupClient.Dialogs.PromptDialog(SupClient.i18n.t("soundEditor:sidebar.settings.sound.file.download.prompt"), options, (name) => {
            if (name == null)
                return;
            triggerDownload(name);
        });
    }
}
function setupSound() {
    if (objectURL != null)
        URL.revokeObjectURL(objectURL);
    const typedArray = new Uint8Array(data.asset.pub.sound);
    const blob = new Blob([typedArray], { type: "audio" });
    objectURL = URL.createObjectURL(blob);
    ui.audioElt.src = objectURL;
}
function setupProperty(path, value) {
    switch (path) {
        case "streaming":
            ui.streamingSelect.value = value;
            break;
    }
}
onAssetCommands.upload = setupSound;
onAssetCommands.setProperty = setupProperty;
// Start
SupClient.i18n.load([{ root: `${window.location.pathname}/../..`, name: "soundEditor" }], start);
