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
