"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const cookies = require("js-cookie");
const path = require("path");
const _ = require("lodash");
const SupClient = require("./index");
exports.languageIds = fs.readdirSync(`${__dirname}/../public/locales`);
const languageCode = cookies.get("supLanguage");
const i18nFallbackContexts = {};
const i18nContexts = {};
let commonLocalesLoaded = false;
function load(files, callback) {
    const firstLoad = !commonLocalesLoaded;
    function onLoadFinished() {
        if (firstLoad) {
            setupDefaultDialogLabels();
            setupHotkeyTitles();
        }
        callback();
    }
    if (languageCode === "none") {
        onLoadFinished();
        return;
    }
    if (!commonLocalesLoaded) {
        files.unshift({ root: "/", name: "common" });
        commonLocalesLoaded = true;
    }
    let filesToLoad = files.length;
    if (filesToLoad === 0) {
        onLoadFinished();
        return;
    }
    if (languageCode !== "en")
        filesToLoad *= 2;
    const loadFile = (languageCode, file, root) => {
        const filePath = path.join(file.root, `locales/${languageCode}`, `${file.name}.json`);
        SupClient.fetch(filePath, "json", (err, response) => {
            if (err != null) {
                filesToLoad -= 1;
                if (filesToLoad === 0)
                    onLoadFinished();
            }
            else {
                const context = file.context != null ? file.context : file.name;
                if (root[context] == null)
                    root[context] = response;
                else
                    root[context] = _.merge(root[context], response);
                filesToLoad -= 1;
                if (filesToLoad === 0)
                    onLoadFinished();
            }
        });
    };
    for (const file of files) {
        loadFile(languageCode, file, i18nContexts);
        if (languageCode !== "en" && languageCode !== "none")
            loadFile("en", file, i18nFallbackContexts);
    }
}
exports.load = load;
function t(key, variables = {}) {
    if (languageCode === "none")
        return key;
    const [context, keys] = key.split(":");
    const keyParts = keys.split(".");
    let value = i18nContexts[context];
    if (value == null)
        return fallbackT(key, variables);
    for (const keyPart of keyParts) {
        value = value[keyPart];
        if (value == null)
            return fallbackT(key, variables);
    }
    if (typeof value === "string")
        return insertVariables(value, variables);
    else
        return key;
}
exports.t = t;
function fallbackT(key, variables = {}) {
    const [context, keys] = key.split(":");
    const keyParts = keys.split(".");
    let valueOrText = i18nFallbackContexts[context];
    if (valueOrText == null)
        return key;
    for (const keyPart of keyParts) {
        valueOrText = valueOrText[keyPart];
        if (valueOrText == null)
            return key;
    }
    if (typeof valueOrText === "string")
        return insertVariables(valueOrText, variables);
    else
        return key;
}
function insertVariables(text, variables) {
    let index = 0;
    do {
        index = text.indexOf("${", index);
        if (index !== -1) {
            const endIndex = text.indexOf("}", index);
            const key = text.slice(index + 2, endIndex);
            const value = variables[key] != null ? variables[key] : `"${key}" is missing`;
            text = text.slice(0, index) + value + text.slice(endIndex + 1);
            index += 1;
        }
    } while (index !== -1);
    return text;
}
function setupDefaultDialogLabels() {
    for (const label in SupClient.Dialogs.BaseDialog.defaultLabels) {
        SupClient.Dialogs.BaseDialog.defaultLabels[label] = t(`common:actions.${label}`);
    }
}
function setupHotkeyTitles() {
    const hotkeyButtons = document.querySelectorAll("[data-hotkey]");
    for (const hotkeyButton of hotkeyButtons) {
        const hotkeys = hotkeyButton.dataset["hotkey"].split("+");
        let hotkeyComplete = "";
        for (const hotkey of hotkeys) {
            let hotkeyPartKey;
            if (hotkey === "control" && window.navigator.platform === "MacIntel")
                hotkeyPartKey = `common:hotkeys.command`;
            else
                hotkeyPartKey = `common:hotkeys.${hotkey}`;
            const hotkeyPartString = t(hotkeyPartKey);
            if (hotkeyComplete !== "")
                hotkeyComplete += "+";
            if (hotkeyPartString === hotkeyPartKey)
                hotkeyComplete += hotkey;
            else
                hotkeyComplete += hotkeyPartString;
        }
        hotkeyButton.title += ` (${hotkeyComplete})`;
    }
}
