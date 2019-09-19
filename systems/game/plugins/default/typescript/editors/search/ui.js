"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const network_1 = require("./network");
const ui = {};
exports.default = ui;
ui.resultsPane = document.querySelector(".results");
ui.searchInput = document.querySelector(".search input");
ui.searchInput.focus();
ui.searchInput.addEventListener("keydown", (event) => { if (event.keyCode === 13)
    search(); });
ui.matchCaseCheckbox = document.getElementById("match-case-checkbox");
document.querySelector(".search button").addEventListener("click", (event) => { search(); });
ui.statusSpan = document.querySelector(".search span");
window.addEventListener("message", (event) => {
    if (event.data.type === "activate")
        ui.searchInput.focus();
    if (event.data.type === "setState") {
        ui.searchInput.value = event.data.state.text;
        search();
    }
});
function escapeRegExp(text) { return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"); }
function search() {
    while (ui.resultsPane.children.length !== 0) {
        const child = ui.resultsPane.children[0];
        child.parentElement.removeChild(child);
    }
    ui.searchRegExp = null;
    ui.textToSearch = ui.searchInput.value;
    if (ui.textToSearch.length > 0) {
        ui.searchRegExp = new RegExp(escapeRegExp(ui.textToSearch), `g${ui.matchCaseCheckbox.checked ? "" : "i"}`);
    }
    for (const assetId in network_1.data.assetsById)
        searchAsset(assetId);
}
function searchAsset(assetId) {
    const asset = network_1.data.assetsById[assetId];
    const name = network_1.data.projectClient.entries.getPathFromId(assetId);
    const results = [];
    if (ui.searchRegExp != null) {
        let match;
        while ((match = ui.searchRegExp.exec(asset.pub.draft)) != null) {
            results.push(match.index);
        }
    }
    let nameElt = document.querySelector(`span[data-id='${assetId}']`);
    let tableElt = document.querySelector(`table[data-id='${assetId}']`);
    if (results.length === 0) {
        if (nameElt != null)
            nameElt.parentElement.removeChild(nameElt);
        if (tableElt != null)
            tableElt.parentElement.removeChild(tableElt);
        refreshGlobalStatus();
        return;
    }
    if (nameElt == null) {
        nameElt = document.createElement("span");
        nameElt.dataset["id"] = assetId;
        ui.resultsPane.appendChild(nameElt);
        nameElt.addEventListener("click", (event) => {
            let tableElt = document.querySelector(`table[data-id='${event.target.dataset["id"]}']`);
            tableElt.classList.toggle("collapsed");
        });
    }
    refreshFileStatus(name, nameElt, results.length);
    if (tableElt == null) {
        tableElt = document.createElement("table");
        tableElt.dataset["id"] = assetId;
        ui.resultsPane.appendChild(tableElt);
        tableElt.addEventListener("click", (event) => {
            let target = event.target;
            while (true) {
                if (target.tagName === "TBODY")
                    return;
                if (target.tagName === "TR")
                    break;
                target = target.parentElement;
            }
            const id = target.dataset["id"];
            const line = target.dataset["line"];
            const ch = target.dataset["ch"];
            if (window.parent != null)
                SupClient.openEntry(id, { line, ch });
        });
    }
    else {
        while (tableElt.children.length !== 0) {
            const child = tableElt.children[0];
            child.parentElement.removeChild(child);
        }
    }
    const textParts = asset.pub.draft.split("\n");
    let previousLine = -1;
    let rankInLine;
    for (const result of results) {
        let position = 0;
        let line = 0;
        while (position + textParts[line].length <= result) {
            position += textParts[line].length + 1;
            line += 1;
        }
        if (line === previousLine) {
            rankInLine += 1;
        }
        else {
            previousLine = line;
            rankInLine = 0;
        }
        const column = result - position;
        const rowElt = document.createElement("tr");
        tableElt.appendChild(rowElt);
        const dataset = rowElt.dataset;
        dataset["id"] = assetId;
        dataset["line"] = line;
        dataset["ch"] = column;
        const lineElt = document.createElement("td");
        rowElt.appendChild(lineElt);
        lineElt.textContent = (line + 1).toString();
        const textElt = document.createElement("td");
        rowElt.appendChild(textElt);
        const startElt = document.createElement("span");
        startElt.textContent = textParts[line].slice(0, column);
        textElt.appendChild(startElt);
        const wordElt = document.createElement("span");
        wordElt.textContent = textParts[line].slice(column, column + ui.textToSearch.length);
        textElt.appendChild(wordElt);
        const endElt = document.createElement("span");
        endElt.textContent = textParts[line].slice(column + ui.textToSearch.length);
        textElt.appendChild(endElt);
    }
    refreshGlobalStatus();
}
exports.searchAsset = searchAsset;
function refreshGlobalStatus() {
    let resultsCount = 0;
    let filesCount = 0;
    for (let index = 1; index < ui.resultsPane.children.length; index += 2) {
        resultsCount += ui.resultsPane.children[index].children.length;
        filesCount += 1;
    }
    if (resultsCount === 0)
        ui.statusSpan.textContent = SupClient.i18n.t("searchEditor:noResults");
    else {
        const results = SupClient.i18n.t(`searchEditor:${resultsCount === 1 ? "oneResult" : "severalResults"}`, { results: resultsCount.toString() });
        const files = SupClient.i18n.t(`searchEditor:${filesCount === 1 ? "oneFile" : "severalFiles"}`, { files: filesCount.toString() });
        ui.statusSpan.textContent = SupClient.i18n.t("searchEditor:resultInfo", { results, files });
    }
}
function refreshFileStatus(fileName, nameElt, count) {
    const results = SupClient.i18n.t(`searchEditor:${count === 1 ? "oneResult" : "severalResults"}`, { results: count.toString() });
    nameElt.textContent = SupClient.i18n.t("searchEditor:fileInfo", { results, fileName });
}
exports.refreshFileStatus = refreshFileStatus;
