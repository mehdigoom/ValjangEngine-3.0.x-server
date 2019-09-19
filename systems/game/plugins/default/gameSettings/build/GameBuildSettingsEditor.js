"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let savedSettings = {
    outputFolder: ""
};
const settingsStorageKey = "superpowers.build.game";
const settingsJSON = window.localStorage.getItem(settingsStorageKey);
if (settingsJSON != null) {
    const parsedSettings = JSON.parse(settingsJSON);
    if (savedSettings != null && typeof savedSettings === "object")
        savedSettings = parsedSettings;
}
class GameBuildSettingsEditor {
    constructor(container, entries, entriesTreeView) {
        this.entries = entries;
        this.entriesTreeView = entriesTreeView;
        const { table, tbody } = SupClient.table.createTable(container);
        this.table = table;
        table.classList.add("properties");
        table.hidden = true;
        const outputFolderRow = SupClient.table.appendRow(tbody, SupClient.i18n.t("buildSettingsEditors:game.outputFolder"));
        const inputs = SupClient.html("div", "inputs", { parent: outputFolderRow.valueCell });
        const value = savedSettings.outputFolder != null ? savedSettings.outputFolder : "";
        this.outputFolderTextfield = SupClient.html("input", { parent: inputs, type: "text", value, readOnly: true, style: { cursor: "pointer" } });
        this.outputFolderButton = SupClient.html("button", { parent: inputs, textContent: SupClient.i18n.t("common:actions.select") });
        this.outputFolderTextfield.addEventListener("click", (event) => { event.preventDefault(); this.selectOutputfolder(); });
        this.outputFolderButton.addEventListener("click", (event) => { event.preventDefault(); this.selectOutputfolder(); });
        const errorRow = SupClient.table.appendRow(tbody, "Error");
        this.errorRowElt = errorRow.row;
        this.errorRowElt.hidden = true;
        this.errorInput = SupClient.html("input", { parent: errorRow.valueCell, type: "text", readOnly: true });
    }
    setVisible(visible) {
        this.table.hidden = !visible;
    }
    getSettings(callback) {
        this.ensureOutputFolderValid((outputFolderValid) => {
            callback(outputFolderValid ? { outputFolder: savedSettings.outputFolder } : null);
        });
    }
    selectOutputfolder() {
        SupApp.chooseFolder((folderPath) => {
            if (folderPath == null)
                return;
            savedSettings.outputFolder = this.outputFolderTextfield.value = folderPath;
            window.localStorage.setItem(settingsStorageKey, JSON.stringify(savedSettings));
            this.ensureOutputFolderValid();
        });
    }
    ensureOutputFolderValid(callback) {
        if (savedSettings.outputFolder == null) {
            this.displayError(SupClient.i18n.t("buildSettingsEditors:game.errors.selectDestionationFolder"));
            if (callback != null)
                callback(false);
            return;
        }
        SupApp.readDir(savedSettings.outputFolder, (err, files) => {
            if (err != null) {
                this.displayError(SupClient.i18n.t("buildSettingsEditors:game.errors.emptyDirectoryCheckFail"));
                console.log(err);
                if (callback != null)
                    callback(false);
                return;
            }
            let index = 0;
            while (index < files.length) {
                const item = files[index];
                if (item[0] === "." || item === "Thumbs.db")
                    files.splice(index, 1);
                else
                    index++;
            }
            if (files.length > 0) {
                this.displayError(SupClient.i18n.t("buildSettingsEditors:game.errors.destinationFolderEmpty"));
                if (callback != null)
                    callback(false);
            }
            else {
                this.errorRowElt.hidden = true;
                if (callback != null)
                    callback(true);
            }
        });
    }
    displayError(err) {
        this.errorRowElt.hidden = false;
        this.errorInput.value = err;
        this.errorRowElt.animate([
            { transform: "translateX(0)" },
            { transform: "translateX(1.5vh)" },
            { transform: "translateX(0)" }
        ], { duration: 100 });
    }
}
exports.default = GameBuildSettingsEditor;
