(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ProjectSettingsEditor {
    constructor(container, projectClient) {
        this.fields = {};
        this.projectClient = projectClient;
        // Vacuum
        {
            const vacuumContainer = document.createElement("div");
            container.appendChild(vacuumContainer);
            const button = document.createElement("button");
            button.style.marginRight = "0.5em";
            button.textContent = SupClient.i18n.t("settingsEditors:Project.deleteTrashedAssetsFromDisk");
            vacuumContainer.appendChild(button);
            const span = document.createElement("span");
            vacuumContainer.appendChild(span);
            button.addEventListener("click", (event) => {
                button.disabled = true;
                this.projectClient.socket.emit("vacuum:project", (err, deletedCount) => {
                    button.disabled = false;
                    if (err != null) {
                        new SupClient.Dialogs.InfoDialog(err);
                        return;
                    }
                    if (deletedCount > 0) {
                        if (deletedCount > 1)
                            span.textContent = SupClient.i18n.t("settingsEditors:Project.severalFoldersRemoved", { folders: deletedCount.toString() });
                        else
                            span.textContent = SupClient.i18n.t("settingsEditors:Project.oneFolderRemoved");
                    }
                    else
                        span.textContent = SupClient.i18n.t("settingsEditors:Project.noFoldersRemoved");
                });
            });
        }
    }
}
exports.default = ProjectSettingsEditor;

},{}],2:[function(require,module,exports){
"use strict";
/// <reference path="../../../common/settings/settingsEditors/SettingsEditorPlugin.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
const ProjectSettingsEditor_1 = require("./ProjectSettingsEditor");
SupClient.registerPlugin("settingsEditors", "Project", {
    namespace: "general",
    editor: ProjectSettingsEditor_1.default
});

},{"./ProjectSettingsEditor":1}]},{},[2]);
