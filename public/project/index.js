(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const network = require("./network");
const sidebar = require("./sidebar");
const header = require("./sidebar/header");
const buttonCallbacks_1 = require("./sidebar/entriesTreeView/buttonCallbacks");
const tabs = require("./tabs");
const tabsAssets = require("./tabs/assets");
const tabsTools = require("./tabs/tools");
const homeTab = require("./tabs/homeTab");
function start() {
    document.body.hidden = false;
    // Development mode
    if (localStorage.getItem("ValjangEngine-dev-mode") != null) {
        const projectManagementDiv = document.querySelector(".project-management");
        projectManagementDiv.style.backgroundColor = "#37d";
        // According to http://stackoverflow.com/a/12747364/915914, window.onerror
        // should be used rather than window.addEventListener("error", ...);
        // to get all errors, including syntax errors.
        window.onerror = onWindowDevError;
    }
    // Global controls
    const toggleNotificationsButton = document.querySelector(".top .controls button.toggle-notifications");
    toggleNotificationsButton.addEventListener("click", onClickToggleNotifications);
    if (localStorage.getItem("ValjangEngine-disable-notifications") != null) {
        toggleNotificationsButton.classList.add("disabled");
        toggleNotificationsButton.title = SupClient.i18n.t("project:header.notifications.enable");
    }
    else {
        toggleNotificationsButton.classList.remove("disabled");
        toggleNotificationsButton.title = SupClient.i18n.t("project:header.notifications.disable");
    }
    sidebar.start();
    tabs.start();
    network.connect();
}
SupClient.i18n.load([{ root: "/", name: "project" }, { root: "/", name: "badges" }], start);
window.addEventListener("message", onMessage);
function onMessage(event) {
    switch (event.data.type) {
        case "chat":
            homeTab.onMessageChat(event.data.content);
            break;
        case "hotkey":
            onMessageHotKey(event.data.content);
            break;
        case "openEntry":
            tabsAssets.open(event.data.id, event.data.state);
            break;
        case "setEntryRevisionDisabled":
            tabsAssets.setRevisionDisabled(event.data.id, event.data.disabled);
            break;
        case "openTool":
            tabsTools.open(event.data.name, event.data.state);
            break;
        case "error":
            onWindowDevError();
            break;
        case "forwardKeyboardEventToActiveTab":
            onForwardKeyboardEventToActiveTab(event.data.eventType, event.data.ctrlKey, event.data.altKey, event.shiftKey, event.metaKey, event.data.keyCode);
            break;
    }
}
function onWindowDevError() {
    const projectManagementDiv = document.querySelector(".project-management");
    projectManagementDiv.style.backgroundColor = "#c42";
    return false;
}
function onMessageHotKey(action) {
    switch (action) {
        case "newAsset":
            buttonCallbacks_1.onNewAssetClick();
            break;
        case "newFolder":
            buttonCallbacks_1.onNewFolderClick();
            break;
        case "searchEntry":
            buttonCallbacks_1.onSearchEntryDialog();
            break;
        case "filter":
            buttonCallbacks_1.onToggleFilterStripClick();
            break;
        case "closeTab":
            tabs.onClose();
            break;
        case "previousTab":
            tabs.onActivatePrevious();
            break;
        case "nextTab":
            tabs.onActivateNext();
            break;
        case "run":
            header.runProject();
            break;
        case "debug":
            header.runProject({ debug: true });
            break;
        case "devtools":
            if (SupApp != null)
                SupApp.getCurrentWindow().webContents.toggleDevTools();
            break;
    }
}
function onClickToggleNotifications(event) {
    let notificationsDisabled = (localStorage.getItem("ValjangEngine-disable-notifications") != null) ? true : false;
    notificationsDisabled = !notificationsDisabled;
    if (!notificationsDisabled) {
        localStorage.removeItem("ValjangEngine-disable-notifications");
        event.target.classList.remove("disabled");
        event.target.title = SupClient.i18n.t("project:header.notifications.disable");
    }
    else {
        localStorage.setItem("ValjangEngine-disable-notifications", "true");
        event.target.classList.add("disabled");
        event.target.title = SupClient.i18n.t("project:header.notifications.enable");
    }
}
function onForwardKeyboardEventToActiveTab(eventType, ctrlKey, altKey, shiftKey, metaKey, keyCode) {
    const event = new KeyboardEvent(eventType, { ctrlKey, altKey, shiftKey, metaKey });
    Object.defineProperty(event, "keyCode", { value: keyCode });
    const activePaneElt = tabs.panesElt.querySelector(".pane-container.active");
    const activeIframe = activePaneElt.querySelector("iframe");
    activeIframe.contentDocument.dispatchEvent(event);
}

},{"./network":2,"./sidebar":8,"./sidebar/entriesTreeView/buttonCallbacks":5,"./sidebar/header":7,"./tabs":11,"./tabs/assets":9,"./tabs/homeTab":10,"./tabs/tools":12}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const async = require("async");
const entriesTreeView = require("./sidebar/entriesTreeView");
const sidebar = require("./sidebar");
const tabs = require("./tabs");
const tabsAssets = require("./tabs/assets");
const tabsTools = require("./tabs/tools");
function connect() {
    exports.socket = SupClient.connect(SupClient.query.project, { reconnection: true });
    exports.socket.on("error", onConnectionError);
    exports.socket.on("disconnect", onDisconnected);
    exports.socket.on("welcome", onWelcome);
    exports.socket.on("setProperty:manifest", onSetManifestProperty);
    exports.socket.on("updateIcon:manifest", onUpdateProjectIcon);
    exports.socket.on("add:entries", onEntryAdded);
    exports.socket.on("move:entries", onEntryMoved);
    exports.socket.on("trash:entries", onEntryTrashed);
    exports.socket.on("setProperty:entries", onSetEntryProperty);
    exports.socket.on("save:entries", onEntrySaved);
    exports.socket.on("set:badges", onBadgeSet);
    exports.socket.on("clear:badges", onBadgeCleared);
    exports.socket.on("add:dependencies", onDependenciesAdded);
    exports.socket.on("remove:dependencies", onDependenciesRemoved);
}
exports.connect = connect;
function onConnectionError() {
    const redirect = encodeURIComponent(`${window.location.pathname}${window.location.search}`);
    window.location.replace(`/login?redirect=${redirect}`);
}
function onDisconnected() {
    SupClient.Dialogs.cancelDialogIfAny();
    exports.entries = null;
    sidebar.disable();
}
function onWelcome(clientId, config) {
    exports.supportsServerBuild = config.supportsServerBuild;
    exports.buildPort = config.buildPort;
    SupClient.fetch(`/systems/${SupCore.system.id}/plugins.json`, "json", (err, thePluginsInfo) => {
        exports.pluginsInfo = thePluginsInfo;
        loadPluginLocales(exports.pluginsInfo.list, () => {
            async.parallel([
                (cb) => { tabsAssets.setup(exports.pluginsInfo.paths.editors, cb); },
                (cb) => { tabsTools.setup(exports.pluginsInfo.paths.tools, cb); }
            ], (err) => {
                if (err)
                    throw err;
                exports.socket.emit("sub", "manifest", null, onManifestReceived);
                exports.socket.emit("sub", "entries", null, onEntriesReceived);
            });
        });
    });
}
function loadPluginLocales(pluginsPaths, cb) {
    const localeFiles = [];
    const pluginsRoot = `/systems/${SupCore.system.id}/plugins`;
    for (const pluginPath of pluginsPaths) {
        localeFiles.push({ root: `${pluginsRoot}/${pluginPath}`, name: "plugin", context: pluginPath });
        localeFiles.push({ root: `${pluginsRoot}/${pluginPath}`, name: "badges" });
    }
    SupClient.i18n.load(localeFiles, cb);
}
function onManifestReceived(err, manifestPub) {
    exports.manifest = new SupCore.Data.ProjectManifest(manifestPub);
    document.querySelector(".project-name").textContent = manifestPub.name;
    document.title = `${manifestPub.name} — ValjangEngine`;
}
function onEntriesReceived(err, entriesPub, nextEntryId) {
    exports.entries = new SupCore.Data.Entries(entriesPub, nextEntryId);
    sidebar.enable();
    if (SupClient.query.asset != null)
        tabsAssets.open(SupClient.query.asset);
    else if (SupClient.query["tool"] != null)
        tabsTools.open(SupClient.query["tool"]);
}
function onSetManifestProperty(key, value) {
    exports.manifest.client_setProperty(key, value);
    switch (key) {
        case "name":
            document.title = `${value} — ValjangEngine`;
            document.querySelector(".project-name").textContent = value;
            break;
    }
}
function onUpdateProjectIcon() {
    // TODO: Update favicon?
}
function onEntryAdded(entry, parentId, index) {
    exports.entries.client_add(entry, parentId, index);
    const liElt = entriesTreeView.createEntryElement(entry);
    const nodeType = (entry.children != null) ? "group" : "item";
    let parentElt;
    if (parentId != null) {
        parentElt = entriesTreeView.widget.treeRoot.querySelector(`[data-id='${parentId}']`);
        const parentEntry = exports.entries.byId[parentId];
        const childrenElt = parentElt.querySelector("span.children");
        childrenElt.textContent = `(${parentEntry.children.length})`;
    }
    entriesTreeView.widget.insertAt(liElt, nodeType, index, parentElt);
}
function onEntryMoved(id, parentId, index) {
    exports.entries.client_move(id, parentId, index);
    const entryElt = entriesTreeView.widget.treeRoot.querySelector(`[data-id='${id}']`);
    const oldParentId = entryElt.dataset["parentId"];
    if (oldParentId != null) {
        const oldParentElt = entriesTreeView.widget.treeRoot.querySelector(`[data-id='${oldParentId}']`);
        const parentEntry = exports.entries.byId[oldParentId];
        const childrenElt = oldParentElt.querySelector("span.children");
        childrenElt.textContent = `(${parentEntry.children.length})`;
    }
    const nodeType = (entryElt.classList.contains("group")) ? "group" : "item";
    let parentElt;
    if (parentId != null) {
        parentElt = entriesTreeView.widget.treeRoot.querySelector(`[data-id='${parentId}']`);
        const parentEntry = exports.entries.byId[parentId];
        const childrenElt = parentElt.querySelector("span.children");
        childrenElt.textContent = `(${parentEntry.children.length})`;
    }
    entriesTreeView.widget.insertAt(entryElt, nodeType, index, parentElt);
    if (parentId != null)
        entryElt.dataset["parentId"] = parentId;
    else
        delete entryElt.dataset["parentId"];
    tabsAssets.refreshTabElement(exports.entries.byId[id]);
}
function onEntryTrashed(id) {
    exports.entries.client_remove(id);
    const entryElt = entriesTreeView.widget.treeRoot.querySelector(`[data-id='${id}']`);
    const oldParentId = entryElt.dataset["parentId"];
    if (oldParentId != null) {
        const oldParentElt = entriesTreeView.widget.treeRoot.querySelector(`[data-id='${oldParentId}']`);
        const parentEntry = exports.entries.byId[oldParentId];
        const childrenElt = oldParentElt.querySelector("span.children");
        childrenElt.textContent = `(${parentEntry.children.length})`;
    }
    entriesTreeView.widget.remove(entryElt);
}
function onSetEntryProperty(id, key, value) {
    exports.entries.client_setProperty(id, key, value);
    const entryElt = entriesTreeView.widget.treeRoot.querySelector(`[data-id='${id}']`);
    switch (key) {
        case "name":
            entryElt.querySelector(".name").textContent = value;
            const walk = (entry) => {
                tabsAssets.refreshTabElement(entry);
                if (entry.children != null)
                    for (const child of entry.children)
                        walk(child);
            };
            walk(exports.entries.byId[id]);
            break;
    }
}
function onEntrySaved(id, revisionId, revisionName) {
    exports.entries.client_save(id, revisionId, revisionName);
    const revisionPaneElt = tabs.panesElt.querySelector(`[data-asset-id='${id}'] .revision-inner-container`);
    if (revisionPaneElt == null)
        return;
    const revisions = exports.entries.byId[id].revisions;
    const selectElt = revisionPaneElt.querySelector("select");
    const optionElt = SupClient.html("option", { textContent: revisionName, value: revisionId });
    if (revisions.length === 1) {
        selectElt.appendChild(optionElt);
    }
    else {
        const previousRevisionId = revisions[revisions.length - 2].id;
        const previousRevisionElt = selectElt.querySelector(`option[value='${previousRevisionId}']`);
        selectElt.insertBefore(optionElt, previousRevisionElt);
    }
}
function onBadgeSet(id, newBadge) {
    const badges = exports.entries.badgesByEntryId[id];
    const existingBadge = badges.byId[newBadge.id];
    if (existingBadge != null) {
        existingBadge.type = newBadge.type;
        existingBadge.data = newBadge.data;
    }
    else
        badges.client_add(newBadge, null);
    const badgesElt = entriesTreeView.widget.treeRoot.querySelector(`[data-id='${id}'] .badges`);
    SupClient.html("span", newBadge.id, { parent: badgesElt, textContent: SupClient.i18n.t(`badges:${newBadge.id}`) });
}
function onBadgeCleared(id, badgeId) {
    const badges = exports.entries.badgesByEntryId[id];
    badges.client_remove(badgeId);
    const badgeElt = entriesTreeView.widget.treeRoot.querySelector(`[data-id='${id}'] .badges .${badgeId}`);
    badgeElt.parentElement.removeChild(badgeElt);
}
function onDependenciesAdded(id, depIds) {
    for (const depId of depIds)
        exports.entries.byId[depId].dependentAssetIds.push(id);
}
function onDependenciesRemoved(id, depIds) {
    for (const depId of depIds) {
        const dependentAssetIds = exports.entries.byId[depId].dependentAssetIds;
        dependentAssetIds.splice(dependentAssetIds.indexOf(id), 1);
    }
}

},{"./sidebar":8,"./sidebar/entriesTreeView":6,"./tabs":11,"./tabs/assets":9,"./tabs/tools":12,"async":13}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const async = require("async");
const TreeView = require("dnd-tree-view");
const network_1 = require("../network");
let buildPluginsLoaded = false;
let previousSelectedPluginName;
class StartBuildDialog extends SupClient.Dialogs.BaseDialog {
    constructor(entries, entriesTreeView, callback) {
        super(callback);
        this.entries = entries;
        this.entriesTreeView = entriesTreeView;
        this.selectedPluginName = previousSelectedPluginName;
        this.settingsEditorsByName = {};
        this.onBuildPluginsLoaded = () => {
            this.loadingContainer.parentElement.removeChild(this.loadingContainer);
            const plugins = SupClient.getPlugins("build");
            const pluginNames = Object.keys(plugins);
            if (plugins == null && pluginNames.length === 0)
                return;
            for (const pluginName of pluginNames) {
                const plugin = plugins[pluginName].content;
                const elt = SupClient.html("li", { dataset: { buildPlugin: pluginName } });
                this.treeView.append(elt, "item");
                SupClient.html("div", "label", { parent: elt, textContent: SupClient.i18n.t(`buildSettingsEditors:${pluginName}.label`) });
                SupClient.html("div", "description", { parent: elt, textContent: SupClient.i18n.t(`buildSettingsEditors:${pluginName}.description`) });
                this.settingsEditorsByName[pluginName] = new plugin.settingsEditor(this.settingsContainer, this.entries, this.entriesTreeView);
            }
            if (this.selectedPluginName == null)
                this.selectedPluginName = pluginNames[0];
            this.treeView.addToSelection(this.treeView.treeRoot.querySelector(`li[data-build-plugin="${this.selectedPluginName}"]`));
            this.settingsEditorsByName[this.selectedPluginName].setVisible(true);
            this.validateButtonElt.disabled = false;
            this.validateButtonElt.focus();
        };
        this.onTreeViewSelectionChange = () => {
            if (this.treeView.selectedNodes.length === 0) {
                this.treeView.addToSelection(this.treeView.treeRoot.querySelector(`li[data-build-plugin="${this.selectedPluginName}"]`));
            }
            else {
                this.settingsEditorsByName[this.selectedPluginName].setVisible(false);
                this.selectedPluginName = this.treeView.selectedNodes[0].dataset["buildPlugin"];
                previousSelectedPluginName = this.selectedPluginName;
                this.settingsEditorsByName[this.selectedPluginName].setVisible(true);
            }
        };
        this.formElt.style.width = "700px";
        SupClient.html("header", { parent: this.formElt, textContent: SupClient.i18n.t("project:build.title") });
        const styleElt = SupClient.html("style", { parent: this.formElt });
        styleElt.textContent = `
    .build-plugins-tree-view ol.tree { position: absolute; }
    .build-plugins-tree-view ol.tree li {
      display: block;
      height: auto;
      padding: .5em 1em;
      white-space: nowrap;
      overflow-x: hidden;
      text-overflow: ellipsis;
    }
    .build-plugins-tree-view .label { font-size: 1.5em; }
    `;
        const mainContainer = SupClient.html("div", "group", {
            parent: this.formElt,
            style: { display: "flex", height: "300px" }
        });
        // Build plugins
        const treeViewContainer = SupClient.html("div", ["build-plugins-tree-view"], {
            parent: mainContainer,
            style: {
                position: "relative",
                border: "1px solid #aaa",
                overflowY: "auto",
                width: "200px",
                marginRight: "0.5em"
            }
        });
        this.loadingContainer = SupClient.html("div", "tree-loading", { parent: treeViewContainer });
        SupClient.html("div", { parent: this.loadingContainer, textContent: SupClient.i18n.t("common:states.loading") });
        this.treeView = new TreeView(treeViewContainer, { multipleSelection: false });
        this.treeView.treeRoot.style.paddingBottom = "0";
        this.treeView.on("selectionChange", this.onTreeViewSelectionChange);
        // Build settings
        this.settingsContainer = SupClient.html("div", {
            parent: mainContainer,
            style: { flex: "1 1 0" }
        });
        // Buttons
        const buttonsElt = SupClient.html("div", "buttons", { parent: this.formElt });
        const cancelButtonElt = SupClient.html("button", "cancel-button", {
            parent: buttonsElt, type: "button",
            textContent: SupClient.i18n.t("common:actions.cancel")
        });
        cancelButtonElt.addEventListener("click", (event) => { event.preventDefault(); this.cancel(); });
        this.validateButtonElt = SupClient.html("button", "validate-button", {
            textContent: SupClient.i18n.t("project:build.build"),
            disabled: true
        });
        if (navigator.platform === "Win32")
            buttonsElt.insertBefore(this.validateButtonElt, cancelButtonElt);
        else
            buttonsElt.appendChild(this.validateButtonElt);
        if (!buildPluginsLoaded)
            loadBuildPlugins(this.onBuildPluginsLoaded);
        else
            this.onBuildPluginsLoaded();
    }
    submit() {
        if (!buildPluginsLoaded)
            return;
        this.settingsEditorsByName[this.selectedPluginName].getSettings((settings) => {
            if (settings == null)
                return;
            const plugin = SupClient.getPlugins("build")[this.selectedPluginName];
            super.submit({
                pluginPath: plugin.path,
                buildPluginName: this.selectedPluginName,
                settings
            });
        });
    }
}
exports.default = StartBuildDialog;
function loadBuildPlugins(callback) {
    const i18nFiles = [];
    for (const pluginName of network_1.pluginsInfo.list) {
        const root = `/systems/${SupCore.system.id}/plugins/${pluginName}`;
        i18nFiles.push({ root, name: "buildSettingsEditors" });
    }
    async.parallel([
        (cb) => {
            SupClient.i18n.load(i18nFiles, cb);
        }, (cb) => {
            async.each(network_1.pluginsInfo.list, (pluginName, cb) => {
                const pluginPath = `/systems/${SupCore.system.id}/plugins/${pluginName}`;
                SupClient.loadScript(`${pluginPath}/bundles/build.js`, cb);
            }, cb);
        }
    ], () => {
        buildPluginsLoaded = true;
        callback();
    });
}

},{"../network":2,"async":13,"dnd-tree-view":14}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TreeView = require("dnd-tree-view");
const assets_1 = require("../../tabs/assets");
class CreateAssetDialog extends SupClient.Dialogs.BaseDialog {
    constructor(open, callback) {
        super(callback);
        this.onTreeViewSelectionChange = () => {
            if (this.treeView.selectedNodes.length === 0) {
                this.treeView.addToSelection(this.treeView.treeRoot.querySelector(`li[data-asset-type="${this.selectedAssetType}"]`));
            }
            else {
                this.selectedAssetType = this.treeView.selectedNodes[0].dataset["assetType"];
            }
        };
        this.onTreeViewActivate = () => {
            this.submit();
        };
        SupClient.html("header", { parent: this.formElt, textContent: SupClient.i18n.t("project:treeView.newAsset.title") });
        SupClient.html("div", "group", { parent: this.formElt, textContent: SupClient.i18n.t("project:treeView.newAsset.prompt") });
        // Type
        const treeViewContainer = SupClient.html("div", ["asset-types-tree-view", "group"], {
            parent: this.formElt,
            style: {
                border: "1px solid #aaa",
                overflowY: "auto",
                height: "300px"
            }
        });
        this.treeView = new TreeView(treeViewContainer, { multipleSelection: false });
        this.treeView.treeRoot.style.paddingBottom = "0";
        this.treeView.on("selectionChange", this.onTreeViewSelectionChange);
        this.treeView.on("activate", this.onTreeViewActivate);
        for (const assetType of assets_1.assetTypes) {
            const elt = SupClient.html("li", { dataset: { assetType } });
            this.treeView.append(elt, "item");
            const icon = SupClient.html("img", { parent: elt, src: "", draggable: false });
            icon.src = `/systems/${SupCore.system.id}/plugins/${assets_1.editorsByAssetType[assetType].pluginPath}/editors/${assetType}/icon.svg`;
            SupClient.html("span", { parent: elt, textContent: assets_1.editorsByAssetType[assetType].title });
        }
        this.treeView.addToSelection(this.treeView.treeRoot.querySelector("li"));
        this.selectedAssetType = assets_1.assetTypes[0];
        // Name
        const nameGroup = SupClient.html("div", "group", { parent: this.formElt, style: { display: "flex" } });
        this.nameInputElt = SupClient.html("input", {
            parent: nameGroup, placeholder: SupClient.i18n.t("project:treeView.newAsset.placeholder"),
            pattern: SupClient.namePattern, title: SupClient.i18n.t("common:namePatternDescription"),
            style: { flex: "1 1 0" }
        });
        // Auto-open checkbox
        const downElt = SupClient.html("div", { parent: this.formElt, style: { display: "flex", alignItems: "center" } });
        this.openCheckboxElt = SupClient.html("input", {
            parent: downElt, id: "auto-open-checkbox", type: "checkbox",
            checked: open, style: { margin: "0 0.5em 0 0" }
        });
        SupClient.html("label", {
            parent: downElt, textContent: SupClient.i18n.t("project:treeView.newAsset.openAfterCreation"),
            htmlFor: "auto-open-checkbox", style: { flex: "1", margin: "0" }
        });
        // Buttons
        const buttonsElt = SupClient.html("div", "buttons", { parent: downElt });
        const cancelButtonElt = SupClient.html("button", "cancel-button", {
            parent: buttonsElt, type: "button",
            textContent: SupClient.i18n.t("common:actions.cancel")
        });
        cancelButtonElt.addEventListener("click", (event) => { event.preventDefault(); this.cancel(); });
        this.validateButtonElt = SupClient.html("button", "validate-button", {
            textContent: SupClient.i18n.t("common:actions.create")
        });
        if (navigator.platform === "Win32")
            buttonsElt.insertBefore(this.validateButtonElt, cancelButtonElt);
        else
            buttonsElt.appendChild(this.validateButtonElt);
        this.treeView.treeRoot.focus();
    }
    submit() {
        super.submit({
            name: this.nameInputElt.value,
            type: this.selectedAssetType,
            open: this.openCheckboxElt.checked
        });
    }
}
exports.default = CreateAssetDialog;

},{"../../tabs/assets":9,"dnd-tree-view":14}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const network_1 = require("../../network");
const tabsAssets = require("../../tabs/assets");
const entriesTreeView = require("./");
const CreateAssetDialog_1 = require("./CreateAssetDialog");
let autoOpenAsset = true;
function onEntryAddedAck(err, id) {
    if (err != null) {
        new SupClient.Dialogs.InfoDialog(err);
        return;
    }
    entriesTreeView.widget.clearSelection();
    let entry = entriesTreeView.widget.treeRoot.querySelector(`li[data-id='${id}']`);
    entriesTreeView.widget.addToSelection(entry);
    entriesTreeView.updateSelectedEntry();
    if (autoOpenAsset)
        tabsAssets.open(id);
    if (network_1.entries.byId[id].type == null)
        entry.classList.remove("collapsed");
}
function onNewAssetClick() {
    new CreateAssetDialog_1.default(autoOpenAsset, (result) => {
        if (result == null)
            return;
        if (result.name === "")
            result.name = SupClient.i18n.t(`${tabsAssets.editorsByAssetType[result.type].pluginPath}:editors.${result.type}.title`);
        autoOpenAsset = result.open;
        network_1.socket.emit("add:entries", result.name, result.type, SupClient.getTreeViewInsertionPoint(entriesTreeView.widget), onEntryAddedAck);
    });
}
exports.onNewAssetClick = onNewAssetClick;
function onNewFolderClick() {
    const options = {
        header: SupClient.i18n.t("project:treeView.newFolder.title"),
        placeholder: SupClient.i18n.t("project:treeView.newFolder.placeholder"),
        initialValue: SupClient.i18n.t("project:treeView.newFolder.initialValue"),
        validationLabel: SupClient.i18n.t("common:actions.create"),
        pattern: SupClient.namePattern,
        title: SupClient.i18n.t("common:namePatternDescription")
    };
    new SupClient.Dialogs.PromptDialog(SupClient.i18n.t("project:treeView.newFolder.prompt"), options, (name) => {
        if (name == null)
            return;
        network_1.socket.emit("add:entries", name, null, SupClient.getTreeViewInsertionPoint(entriesTreeView.widget), onEntryAddedAck);
    });
}
exports.onNewFolderClick = onNewFolderClick;
function onRenameEntryClick() {
    if (entriesTreeView.widget.selectedNodes.length !== 1)
        return;
    const selectedNode = entriesTreeView.widget.selectedNodes[0];
    const entry = network_1.entries.byId[selectedNode.dataset["id"]];
    const options = {
        header: SupClient.i18n.t("common:actions.rename"),
        initialValue: entry.name,
        validationLabel: SupClient.i18n.t("common:actions.rename"),
        pattern: SupClient.namePattern,
        title: SupClient.i18n.t("common:namePatternDescription")
    };
    new SupClient.Dialogs.PromptDialog(SupClient.i18n.t("project:treeView.renamePrompt"), options, (newName) => {
        if (newName == null || newName === entry.name)
            return;
        network_1.socket.emit("setProperty:entries", entry.id, "name", newName, (err) => {
            if (err != null) {
                new SupClient.Dialogs.InfoDialog(err);
                return;
            }
        });
    });
}
exports.onRenameEntryClick = onRenameEntryClick;
function onDuplicateEntryClick() {
    if (entriesTreeView.widget.selectedNodes.length !== 1)
        return;
    const selectedNode = entriesTreeView.widget.selectedNodes[0];
    const entry = network_1.entries.byId[selectedNode.dataset["id"]];
    const options = {
        header: SupClient.i18n.t("common:actions.duplicate"),
        initialValue: entry.name,
        validationLabel: SupClient.i18n.t("common:actions.duplicate"),
        pattern: SupClient.namePattern,
        title: SupClient.i18n.t("common:namePatternDescription")
    };
    new SupClient.Dialogs.PromptDialog(SupClient.i18n.t("project:treeView.duplicatePrompt"), options, (newName) => {
        if (newName == null)
            return;
        const insertionPoint = entry.type == null ? SupClient.getTreeViewSiblingInsertionPoint(entriesTreeView.widget) : SupClient.getTreeViewInsertionPoint(entriesTreeView.widget);
        network_1.socket.emit("duplicate:entries", newName, entry.id, insertionPoint, onEntryAddedAck);
    });
}
exports.onDuplicateEntryClick = onDuplicateEntryClick;
function onTrashEntryClick() {
    if (entriesTreeView.widget.selectedNodes.length === 0)
        return;
    const selectedEntries = [];
    function checkNextEntry() {
        selectedEntries.splice(0, 1);
        if (selectedEntries.length === 0) {
            const confirmLabel = SupClient.i18n.t("project:treeView.trash.prompt");
            const options = {
                header: SupClient.i18n.t("project:treeView.trash.title"),
                validationLabel: SupClient.i18n.t("project:treeView.trash.title"),
                checkboxLabel: SupClient.i18n.t("project:treeView.trash.checkbox")
            };
            new SupClient.Dialogs.ConfirmDialog(confirmLabel, options, (confirm) => {
                if (!confirm)
                    return;
                for (const selectedNode of entriesTreeView.widget.selectedNodes) {
                    const entry = network_1.entries.byId[selectedNode.dataset["id"]];
                    network_1.socket.emit("trash:entries", entry.id, (err) => {
                        if (err != null) {
                            new SupClient.Dialogs.InfoDialog(err);
                            return;
                        }
                    });
                }
                entriesTreeView.widget.clearSelection();
            });
        }
        else
            warnBrokenDependency(selectedEntries[0]);
    }
    function warnBrokenDependency(entry) {
        if (entry.type == null)
            for (const entryChild of entry.children)
                selectedEntries.push(entryChild);
        if (entry.dependentAssetIds != null && entry.dependentAssetIds.length > 0) {
            const dependentAssetNames = [];
            for (const usingId of entry.dependentAssetIds)
                dependentAssetNames.push(network_1.entries.getPathFromId(usingId));
            const infoLabel = SupClient.i18n.t("project:treeView.trash.warnBrokenDependency", {
                entryName: network_1.entries.getPathFromId(entry.id), dependentEntryNames: dependentAssetNames.join(", ")
            });
            new SupClient.Dialogs.InfoDialog(infoLabel, null, () => { checkNextEntry(); });
        }
        else
            checkNextEntry();
    }
    for (const selectedNode of entriesTreeView.widget.selectedNodes)
        selectedEntries.push(network_1.entries.byId[selectedNode.dataset["id"]]);
    warnBrokenDependency(selectedEntries[0]);
}
exports.onTrashEntryClick = onTrashEntryClick;
const entriesFilterStrip = document.querySelector(".filter-buttons");
function setupFilterStrip() {
    const filterElt = entriesFilterStrip;
    filterElt.innerHTML = "";
    const toggleAllElt = SupClient.html("img", "toggle-all", { parent: filterElt, draggable: false });
    toggleAllElt.addEventListener("click", onToggleAllFilterClick);
    for (const assetType of tabsAssets.assetTypes) {
        const iconElt = SupClient.html("img", { parent: filterElt, dataset: { assetType }, draggable: false });
        iconElt.src = `/systems/${SupCore.system.id}/plugins/${tabsAssets.editorsByAssetType[assetType].pluginPath}/editors/${assetType}/icon.svg`;
        iconElt.addEventListener("click", onToggleAssetTypeFilterClick);
    }
}
exports.setupFilterStrip = setupFilterStrip;
function onToggleAssetTypeFilterClick(event) {
    const filterElt = event.target;
    const filtered = filterElt.classList.toggle("filtered");
    const assetType = filterElt.dataset["assetType"];
    const entryElts = entriesTreeView.widget.treeRoot.querySelectorAll(`[data-asset-type='${assetType}']`);
    for (const entryElt of entryElts)
        entryElt.hidden = filtered;
    let allAssetTypesFiltered = true;
    for (const assetType of tabsAssets.assetTypes) {
        const filtered = entriesFilterStrip.querySelector(`[data-asset-type='${assetType}']`).classList.contains("filtered");
        if (!filtered) {
            allAssetTypesFiltered = false;
            break;
        }
    }
    entriesFilterStrip.querySelector(`.toggle-all`).classList.toggle("filtered", allAssetTypesFiltered);
}
function onToggleAllFilterClick() {
    const enableAllFilters = !entriesFilterStrip.querySelector(".toggle-all").classList.contains("filtered");
    const filterElts = entriesFilterStrip.querySelectorAll("img");
    for (const filterElt of filterElts) {
        filterElt.classList.toggle("filtered", enableAllFilters);
        const assetType = filterElt.dataset["assetType"];
        const entryElts = entriesTreeView.widget.treeRoot.querySelectorAll(`[data-asset-type='${assetType}']`);
        for (const entryElt of entryElts)
            entryElt.hidden = enableAllFilters;
    }
}
function onToggleFilterStripClick() {
    entriesFilterStrip.hidden = !entriesFilterStrip.hidden;
    if (entriesFilterStrip.hidden) {
        const hiddenEntryElts = entriesTreeView.widget.treeRoot.querySelectorAll("li.item[hidden]");
        for (const hiddenEntryElt of hiddenEntryElts)
            hiddenEntryElt.hidden = false;
    }
    else {
        for (const assetType of tabsAssets.assetTypes) {
            const filtered = entriesFilterStrip.querySelector(`[data-asset-type='${assetType}']`).classList.contains("filtered");
            const entryElts = entriesTreeView.widget.treeRoot.querySelectorAll(`[data-asset-type='${assetType}']`);
            for (const entryElt of entryElts)
                entryElt.hidden = filtered;
        }
    }
}
exports.onToggleFilterStripClick = onToggleFilterStripClick;
function onSearchEntryDialog() {
    if (network_1.entries == null)
        return;
    new SupClient.Dialogs.FindAssetDialog(network_1.entries, tabsAssets.editorsByAssetType, (entryId) => {
        if (entryId == null)
            return;
        tabsAssets.open(entryId);
        entriesTreeView.widget.clearSelection();
        const entryElt = entriesTreeView.widget.treeRoot.querySelector(`[data-id='${entryId}']`);
        entriesTreeView.widget.addToSelection(entryElt);
        entriesTreeView.widget.scrollIntoView(entryElt);
    });
}
exports.onSearchEntryDialog = onSearchEntryDialog;

},{"../../network":2,"../../tabs/assets":9,"./":6,"./CreateAssetDialog":4}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TreeView = require("dnd-tree-view");
const network_1 = require("../../network");
const tabsAssets = require("../../tabs/assets");
const sidebar = require("../");
const buttonCallbacks_1 = require("./buttonCallbacks");
function start() {
    exports.widget = new TreeView(document.querySelector(".entries-tree-view"), { dragStartCallback: onEntryDragStart, dropCallback: onTreeViewDrop });
    exports.widget.on("selectionChange", updateSelectedEntry);
    exports.widget.on("activate", onEntryActivate);
    document.querySelector(".entries-buttons .new-asset").addEventListener("click", buttonCallbacks_1.onNewAssetClick);
    document.querySelector(".entries-buttons .new-folder").addEventListener("click", buttonCallbacks_1.onNewFolderClick);
    document.querySelector(".entries-buttons .search").addEventListener("click", buttonCallbacks_1.onSearchEntryDialog);
    document.querySelector(".entries-buttons .rename-entry").addEventListener("click", buttonCallbacks_1.onRenameEntryClick);
    document.querySelector(".entries-buttons .duplicate-entry").addEventListener("click", buttonCallbacks_1.onDuplicateEntryClick);
    document.querySelector(".entries-buttons .trash-entry").addEventListener("click", buttonCallbacks_1.onTrashEntryClick);
    document.querySelector(".entries-buttons .filter").addEventListener("click", buttonCallbacks_1.onToggleFilterStripClick);
    sidebar.openInNewWindowButton.addEventListener("click", onOpenInNewWindowClick);
    // Hot-keys
    exports.widget.treeRoot.addEventListener("keydown", (event) => {
        if (document.querySelector(".dialog") != null)
            return;
        if (event.keyCode === 113) { // F2
            event.preventDefault();
            buttonCallbacks_1.onRenameEntryClick();
        }
        if (event.keyCode === 68 && (event.ctrlKey || event.metaKey)) { // Ctrl+D
            event.preventDefault();
            buttonCallbacks_1.onDuplicateEntryClick();
        }
        if (event.keyCode === 46) { // Delete
            event.preventDefault();
            buttonCallbacks_1.onTrashEntryClick();
        }
    });
}
exports.start = start;
function enable() {
    document.querySelector(".entries-buttons .new-asset").disabled = false;
    document.querySelector(".entries-buttons .new-folder").disabled = false;
    document.querySelector(".entries-buttons .search").disabled = false;
    document.querySelector(".entries-buttons .filter").disabled = false;
    document.querySelector(".filter-buttons").hidden = true;
    document.querySelector(".entries-tree-view .tree-loading").hidden = true;
    function walk(entry, parentEntry, parentElt) {
        const liElt = createEntryElement(entry);
        liElt.classList.add("collapsed");
        const nodeType = (entry.children != null) ? "group" : "item";
        exports.widget.append(liElt, nodeType, parentElt);
        if (entry.children != null)
            for (const child of entry.children)
                walk(child, entry, liElt);
    }
    for (const entry of network_1.entries.pub)
        walk(entry, null, null);
    buttonCallbacks_1.setupFilterStrip();
}
exports.enable = enable;
function disable() {
    exports.widget.clear();
    document.querySelector(".entries-buttons .new-asset").disabled = true;
    document.querySelector(".entries-buttons .new-folder").disabled = true;
    document.querySelector(".entries-buttons .search").disabled = true;
    document.querySelector(".entries-buttons .rename-entry").disabled = true;
    document.querySelector(".entries-buttons .duplicate-entry").disabled = true;
    document.querySelector(".entries-buttons .trash-entry").disabled = true;
    document.querySelector(".entries-buttons .filter").disabled = true;
    document.querySelector(".filter-buttons").hidden = true;
    document.querySelector(".entries-tree-view .tree-loading").hidden = false;
}
exports.disable = disable;
function createEntryElement(entry) {
    const liElt = SupClient.html("li", { dataset: { id: entry.id } });
    const parentEntry = network_1.entries.parentNodesById[entry.id];
    if (parentEntry != null)
        liElt.dataset["parentId"] = parentEntry.id;
    if (entry.type != null) {
        liElt.dataset["assetType"] = entry.type;
        const iconElt = SupClient.html("img", { parent: liElt, draggable: false });
        iconElt.src = `/systems/${SupCore.system.id}/plugins/${tabsAssets.editorsByAssetType[entry.type].pluginPath}/editors/${entry.type}/icon.svg`;
    }
    SupClient.html("span", "name", { parent: liElt, textContent: entry.name });
    if (entry.type != null) {
        const badgesSpan = SupClient.html("span", "badges", { parent: liElt });
        for (const badge of entry.badges)
            SupClient.html("span", badge.id, { parent: badgesSpan, textContent: SupClient.i18n.t(`badges:${badge.id}`) });
        liElt.addEventListener("mouseenter", (event) => { liElt.appendChild(sidebar.openInNewWindowButton); });
        liElt.addEventListener("mouseleave", (event) => {
            if (sidebar.openInNewWindowButton.parentElement != null)
                sidebar.openInNewWindowButton.parentElement.removeChild(sidebar.openInNewWindowButton);
        });
    }
    else {
        const childrenElt = SupClient.html("span", "children", { parent: liElt, textContent: `(${entry.children.length})`, style: { display: "none" } });
        liElt.addEventListener("mouseenter", (event) => { childrenElt.style.display = ""; });
        liElt.addEventListener("mouseleave", (event) => { childrenElt.style.display = "none"; });
    }
    return liElt;
}
exports.createEntryElement = createEntryElement;
function onEntryDragStart(event, entryElt) {
    const id = entryElt.dataset["id"];
    event.dataTransfer.setData("text/plain", network_1.entries.getPathFromId(id));
    const entryIds = [id];
    for (const node of exports.widget.selectedNodes) {
        if (node.dataset["id"] !== id)
            entryIds.push(node.dataset["id"]);
    }
    event.dataTransfer.setData("application/vnd.ValjangEngine.entry", entryIds.join(","));
    return true;
}
function onTreeViewDrop(event, dropLocation, orderedNodes) {
    if (orderedNodes == null) {
        // TODO: Support creating assets by importing some files
        return false;
    }
    const dropPoint = SupClient.getTreeViewDropPoint(dropLocation, network_1.entries);
    const entryIds = [];
    for (const entry of orderedNodes)
        entryIds.push(entry.dataset["id"]);
    const sourceParentNode = network_1.entries.parentNodesById[entryIds[0]];
    const sourceChildren = (sourceParentNode != null && sourceParentNode.children != null) ? sourceParentNode.children : network_1.entries.pub;
    const sameParent = (sourceParentNode != null && dropPoint.parentId === sourceParentNode.id);
    let i = 0;
    for (const id of entryIds) {
        network_1.socket.emit("move:entries", id, dropPoint.parentId, dropPoint.index + i, (err) => {
            if (err != null) {
                new SupClient.Dialogs.InfoDialog(err);
                return;
            }
        });
        if (!sameParent || sourceChildren.indexOf(network_1.entries.byId[id]) >= dropPoint.index)
            i++;
    }
    return false;
}
function updateSelectedEntry() {
    const allButtons = document.querySelectorAll(".entries-buttons button.edit");
    for (let index = 0; index < allButtons.length; index++) {
        const button = allButtons.item(index);
        button.disabled = exports.widget.selectedNodes.length === 0 || (button.classList.contains("single") && exports.widget.selectedNodes.length !== 1);
    }
}
exports.updateSelectedEntry = updateSelectedEntry;
function scrollEntryIntoView(entryId) {
    const entryElt = exports.widget.treeRoot.querySelector(`[data-id='${entryId}']`);
    exports.widget.clearSelection();
    exports.widget.scrollIntoView(entryElt);
    exports.widget.addToSelection(entryElt);
}
exports.scrollEntryIntoView = scrollEntryIntoView;
function onEntryActivate() {
    const activatedEntry = exports.widget.selectedNodes[0];
    tabsAssets.open(activatedEntry.dataset["id"]);
}
function onOpenInNewWindowClick(event) {
    const id = event.target.parentElement.dataset["id"];
    const name = event.target.parentElement.dataset["name"];
    let url;
    if (id != null)
        url = `${window.location.origin}/project/?project=${SupClient.query.project}&asset=${id}`;
    else
        url = `${window.location.origin}/project/?project=${SupClient.query.project}&tool=${name}`;
    if (SupApp != null)
        SupApp.openWindow(url);
    else
        window.open(url);
}

},{"../":8,"../../network":2,"../../tabs/assets":9,"./buttonCallbacks":5,"dnd-tree-view":14}],7:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const network_1 = require("../network");
const entriesTreeView = require("./entriesTreeView");
const StartBuildDialog_1 = require("./StartBuildDialog");
const projectButtons = document.querySelector(".project-buttons");
const runButton = projectButtons.querySelector(".run");
const debugButton = projectButtons.querySelector(".debug");
const stopButton = projectButtons.querySelector(".stop");
const buildButton = projectButtons.querySelector(".build");
function start() {
    if (SupClient.query.project == null)
        goToHub();
    document.querySelector(".project-icon .go-to-hub").addEventListener("click", () => { goToHub(); });
    buildButton.addEventListener("click", () => { openStartBuildDialog(); });
    runButton.addEventListener("click", () => { runProject(); });
    debugButton.addEventListener("click", () => { runProject({ debug: true }); });
    stopButton.addEventListener("click", () => { stopProject(); });
    if (SupApp == null)
        buildButton.title = SupClient.i18n.t("project:header.buildDisabled");
}
exports.start = start;
function enable() {
    runButton.hidden = !network_1.supportsServerBuild;
    debugButton.hidden = !network_1.supportsServerBuild || SupApp == null;
    stopButton.hidden = !network_1.supportsServerBuild || SupApp == null;
    projectButtons.hidden = false;
    runButton.disabled = false;
    debugButton.disabled = false;
    buildButton.disabled = SupApp == null;
}
exports.enable = enable;
function disable() {
    runButton.disabled = true;
    debugButton.disabled = true;
    buildButton.disabled = true;
}
exports.disable = disable;
function goToHub() {
    if (SupApp != null)
        SupApp.showMainWindow();
    else
        window.location.replace("/");
}
let runWindow;
let runWindowDestroyTimeout;
if (SupApp != null) {
    window.addEventListener("beforeunload", () => {
        if (runWindow != null)
            runWindow.removeListener("closed", onCloseRunWindow);
    });
}
function runProject(options = { debug: false }) {
    if (runButton.hidden || runButton.disabled)
        return;
    if (SupApp != null) {
        if (runWindow == null) {
            runWindow = SupApp.openWindow(`${window.location.origin}/serverBuild`);
            runWindow.setMenuBarVisibility(false);
            runWindow.on("closed", onCloseRunWindow);
            document.querySelector(".project-buttons").classList.toggle("running", true);
        }
        runWindow.show();
        runWindow.focus();
        stopButton.disabled = false;
    }
    else
        window.open("/serverBuild", `player_${SupClient.query.project}`);
    network_1.socket.emit("build:project", (err, buildId) => {
        if (err != null) {
            new SupClient.Dialogs.InfoDialog(err);
            return;
        }
        let url = `${window.location.protocol}//${window.location.hostname}:${network_1.buildPort}/systems/${SupCore.system.id}/?project=${SupClient.query.project}&build=${buildId}`;
        if (options.debug)
            url += "&debug";
        if (SupApp != null) {
            if (runWindow != null)
                runWindow.loadURL(url);
        }
        else
            window.open(url, `player_${SupClient.query.project}`);
    });
}
exports.runProject = runProject;
function onCloseRunWindow() {
    runWindow = null;
    if (runWindowDestroyTimeout != null) {
        clearTimeout(runWindowDestroyTimeout);
        runWindowDestroyTimeout = null;
    }
    stopButton.disabled = true;
}
function stopProject() {
    stopButton.disabled = true;
    // Send a message to ask the window to exit gracefully
    // So that it has a chance to clean things up
    runWindow.webContents.send("sup-app-message-force-quit");
    // If it doesn't, destroy it
    runWindowDestroyTimeout = setTimeout(destroyRunWindow, 500);
}
function destroyRunWindow() {
    runWindowDestroyTimeout = null;
    if (runWindow != null) {
        runWindow.destroy();
        runWindow = null;
    }
}
let buildWindow;
if (SupApp != null)
    SupApp.onMessage("build-finished", () => { buildButton.disabled = false; });
function openStartBuildDialog() {
    new StartBuildDialog_1.default(network_1.entries, entriesTreeView.widget, (buildSetup) => {
        if (buildSetup == null)
            return;
        if (buildWindow != null) {
            buildWindow.removeListener("closed", onCloseBuildWindow);
            buildWindow.close();
            buildWindow = null;
        }
        buildWindow = SupApp.openWindow(`${window.location.origin}/build/?project=${SupClient.query.project}`, { size: { width: 600, height: 150 }, resizable: false });
        buildWindow.on("closed", onCloseBuildWindow);
        buildButton.disabled = true;
        buildWindow.webContents.addListener("did-finish-load", () => { buildWindow.webContents.send("sup-app-message-build", buildSetup, SupApp.getCurrentWindow().id); });
    });
}
function onCloseBuildWindow() {
    buildWindow = null;
    buildButton.disabled = false;
}

},{"../network":2,"./StartBuildDialog":3,"./entriesTreeView":6}],8:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ResizeHandle = require("resize-handle");
const entriesTreeView = require("./entriesTreeView");
const header = require("./header");
exports.openInNewWindowButton = SupClient.html("button", "open-in-new-window", { title: SupClient.i18n.t("project:treeView.openInNewWindow") });
function start() {
    const sidebarResizeHandle = new ResizeHandle(document.querySelector(".sidebar"), "left");
    if (SupClient.query.asset != null || SupClient.query["tool"] != null) {
        sidebarResizeHandle.handleElt.classList.add("collapsed");
        sidebarResizeHandle.targetElt.style.width = "0";
        sidebarResizeHandle.targetElt.style.display = "none";
    }
    header.start();
    entriesTreeView.start();
}
exports.start = start;
function enable() {
    header.enable();
    entriesTreeView.enable();
}
exports.enable = enable;
function disable() {
    header.disable();
    entriesTreeView.disable();
}
exports.disable = disable;

},{"./entriesTreeView":6,"./header":7,"resize-handle":17}],9:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const async = require("async");
const network_1 = require("../network");
const entriesTreeView = require("../sidebar/entriesTreeView");
const tabs = require("./");
function setup(editorPaths, callback) {
    exports.editorsByAssetType = {};
    const pluginsRoot = `/systems/${SupCore.system.id}/plugins`;
    async.each(Object.keys(editorPaths), (assetType, cb) => {
        const toolTitle = SupClient.i18n.t(`${editorPaths[assetType]}:editors.${assetType}.title`);
        const pluginPath = editorPaths[assetType];
        exports.editorsByAssetType[assetType] = { title: toolTitle, pluginPath, revision: false };
        SupClient.fetch(`${pluginsRoot}/${pluginPath}/editors/${assetType}/manifest.json`, "json", (err, editorManifest) => {
            if (err != null) {
                cb(err);
                return;
            }
            exports.editorsByAssetType[assetType].revision = editorManifest.revision;
            cb();
        });
    }, (err) => {
        if (err != null) {
            callback(err);
            return;
        }
        exports.assetTypes = Object.keys(editorPaths).sort((a, b) => exports.editorsByAssetType[a].title.localeCompare(exports.editorsByAssetType[b].title));
        callback();
    });
}
exports.setup = setup;
function open(id, state) {
    const entry = network_1.entries.byId[id];
    if (entry == null)
        return;
    // Just toggle folders
    if (entry.type == null) {
        entriesTreeView.widget.selectedNodes[0].classList.toggle("collapsed");
        return;
    }
    entriesTreeView.scrollEntryIntoView(id);
    let tab = tabs.tabStrip.tabsRoot.querySelector(`li[data-asset-id='${id}']`);
    if (tab == null) {
        tab = createTabElement(entry);
        tabs.tabStrip.tabsRoot.appendChild(tab);
        const paneElt = SupClient.html("div", "pane-container", { parent: tabs.panesElt, dataset: { assetId: id } });
        const revisionOuterContainer = SupClient.html("div", "revision-outer-container", { parent: paneElt, hidden: !exports.editorsByAssetType[entry.type].revision });
        const revisionInnerContainer = SupClient.html("div", "revision-inner-container", { parent: revisionOuterContainer });
        SupClient.html("span", { parent: revisionInnerContainer, textContent: SupClient.i18n.t("project:revision.title") });
        const selectElt = SupClient.html("select", { parent: revisionInnerContainer, disabled: true });
        SupClient.html("option", { parent: selectElt, textContent: SupClient.i18n.t("project:revision.current"), value: "current" });
        for (let revisionIndex = entry.revisions.length - 1; revisionIndex >= 0; revisionIndex--) {
            const revision = entry.revisions[revisionIndex];
            SupClient.html("option", { parent: selectElt, textContent: revision.name, value: revision.id });
        }
        const saveOrRestoreButtonElt = SupClient.html("button", { parent: revisionInnerContainer, textContent: SupClient.i18n.t("common:actions.save"), disabled: true });
        const src = `/systems/${SupCore.system.id}/plugins/${exports.editorsByAssetType[entry.type].pluginPath}/editors/${entry.type}/?project=${SupClient.query.project}&asset=${id}`;
        const iframe = SupClient.html("iframe", { parent: paneElt, src });
        if (state != null)
            iframe.addEventListener("load", () => { iframe.contentWindow.postMessage({ type: "setState", state }, window.location.origin); });
        selectElt.addEventListener("change", () => {
            saveOrRestoreButtonElt.textContent = SupClient.i18n.t(`common:actions.${selectElt.value === "current" ? "save" : "restore"}`);
            iframe.contentWindow.postMessage({ type: "setRevision", revisionId: selectElt.value }, window.location.origin);
        });
        saveOrRestoreButtonElt.addEventListener("click", () => {
            if (selectElt.value === "current") {
                const date = new Date();
                const defaultRevisionName = date.getUTCFullYear() + "-" +
                    `00${date.getUTCMonth() + 1}`.slice(-2) + "-" +
                    `00${date.getUTCDate()}`.slice(-2) + " " +
                    `00${date.getUTCHours()}`.slice(-2) + "-" +
                    `00${date.getUTCMinutes() + 1}`.slice(-2);
                const options = {
                    header: SupClient.i18n.t("project:revision.title"),
                    validationLabel: SupClient.i18n.t("common:actions.save"),
                    initialValue: defaultRevisionName,
                    title: SupClient.i18n.t("common:namePatternDescription"),
                    pattern: SupClient.namePattern
                };
                /* tslint:disable:no-unused-expression */
                new SupClient.Dialogs.PromptDialog(SupClient.i18n.t("project:revision.prompt"), options, (revisionName) => {
                    /* tslint:enable:no-unused-expression */
                    if (revisionName == null)
                        return;
                    network_1.socket.emit("save:entries", id, revisionName, (err) => {
                        if (err != null) {
                            /* tslint:disable:no-unused-expression */
                            new SupClient.Dialogs.InfoDialog(err);
                            /* tslint:enable:no-unused-expression */
                            return;
                        }
                    });
                });
            }
            else {
                selectElt.disabled = true;
                saveOrRestoreButtonElt.disabled = true;
                saveOrRestoreButtonElt.textContent = SupClient.i18n.t("project:revision.restoring");
                network_1.socket.emit("restore:assets", id, selectElt.value, (err) => {
                    if (err != null) {
                        /* tslint:disable:no-unused-expression */
                        new SupClient.Dialogs.InfoDialog(err);
                        /* tslint:enable:no-unused-expression */
                        return;
                    }
                    selectElt.disabled = false;
                    selectElt.value = "current";
                    saveOrRestoreButtonElt.disabled = false;
                    saveOrRestoreButtonElt.textContent = SupClient.i18n.t("common:actions.save");
                    iframe.contentWindow.postMessage({ type: "setRevision", revisionId: "restored" }, window.location.origin);
                });
            }
        });
    }
    else if (state != null) {
        const iframe = tabs.panesElt.querySelector(`[data-asset-id='${id}'] iframe`);
        iframe.contentWindow.postMessage({ type: "setState", state }, window.location.origin);
    }
    tabs.onActivate(tab);
    return tab;
}
exports.open = open;
function createTabElement(entry) {
    const tabElt = SupClient.html("li", { dataset: { assetId: entry.id } });
    if (entry.type != null) {
        const iconElt = SupClient.html("img", "icon", { parent: tabElt });
        iconElt.src = `/systems/${SupCore.system.id}/plugins/${exports.editorsByAssetType[entry.type].pluginPath}/editors/${entry.type}/icon.svg`;
        // FIXME: This event isn't emitted on the last opened tab in Chrome. Works fine in Firefox though
        tabElt.addEventListener("dblclick", () => { entriesTreeView.scrollEntryIntoView(entry.id); });
    }
    const tabLabel = SupClient.html("div", "label", { parent: tabElt });
    SupClient.html("div", "location", { parent: tabLabel });
    SupClient.html("div", "name", { parent: tabLabel });
    const closeButton = SupClient.html("button", "close", { parent: tabElt });
    closeButton.addEventListener("click", () => { tabs.onClose(tabElt); });
    refreshTabElement(entry, tabElt);
    return tabElt;
}
function refreshTabElement(entry, tabElt) {
    if (tabElt == null)
        tabElt = tabs.tabStrip.tabsRoot.querySelector(`li[data-asset-id='${entry.id}']`);
    if (tabElt == null)
        return;
    const entryPath = network_1.entries.getPathFromId(entry.id);
    const entryName = entry.name;
    const lastSlash = entryPath.lastIndexOf("/");
    let entryLocation = (lastSlash !== -1) ? entryPath.slice(0, lastSlash) : "";
    const maxEntryLocationLength = 20;
    while (entryLocation.length > maxEntryLocationLength) {
        const slashIndex = entryLocation.indexOf("/", 2);
        if (slashIndex === -1)
            break;
        entryLocation = `…/${entryLocation.slice(slashIndex + 1)}`;
    }
    tabElt.querySelector(".label .location").textContent = entryLocation;
    tabElt.querySelector(".label .name").textContent = entryName;
    tabElt.title = entryPath;
}
exports.refreshTabElement = refreshTabElement;
function setRevisionDisabled(id, disabled) {
    const revisionContainer = tabs.panesElt.querySelector(`[data-asset-id='${id}'] .revision-inner-container`);
    revisionContainer.querySelector("select").disabled = disabled;
    revisionContainer.querySelector("button").disabled = disabled;
}
exports.setRevisionDisabled = setRevisionDisabled;

},{"../network":2,"../sidebar/entriesTreeView":6,"./":11,"async":13}],10:[function(require,module,exports){
"use strict";
// FIXME: This shouldn't be directly on the client since it comes from a plugin?
Object.defineProperty(exports, "__esModule", { value: true });
const network_1 = require("../network");
const tabs = require("./");
let homeTab;
function setup(tab) {
    homeTab = tab;
}
exports.setup = setup;
function onMessageChat(message) {
    if (homeTab == null)
        return;
    const isHomeTabVisible = homeTab.classList.contains("active");
    if (isHomeTabVisible && !document.hidden)
        return;
    if (!isHomeTabVisible)
        homeTab.classList.add("unread");
    if (localStorage.getItem("ValjangEngine-disable-notifications") != null)
        return;
    function doNotification() {
        const title = SupClient.i18n.t("project:header.notifications.new", { projectName: network_1.manifest.pub.name });
        const notification = new window.Notification(title, { icon: "/images/icon.png", body: message });
        const closeTimeoutId = setTimeout(() => { notification.close(); }, 5000);
        notification.addEventListener("click", () => {
            window.focus();
            tabs.onActivate(homeTab);
            clearTimeout(closeTimeoutId);
            notification.close();
        });
    }
    if (window.Notification.permission === "granted")
        doNotification();
    else if (window.Notification.permission !== "denied") {
        window.Notification.requestPermission((status) => {
            window.Notification.permission = status;
            if (window.Notification.permission === "granted")
                doNotification();
        });
    }
}
exports.onMessageChat = onMessageChat;

},{"../network":2,"./":11}],11:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TabStrip = require("tab-strip");
const tabsBarElt = document.querySelector(".tabs-bar");
exports.tabStrip = new TabStrip(tabsBarElt);
exports.panesElt = document.querySelector(".main .panes");
function start() {
    exports.tabStrip.on("activateTab", onActivate);
    exports.tabStrip.on("closeTab", onClose);
    // Prevent <iframe> panes from getting mouse event while dragging tabs
    function restorePanesMouseEvent(event) {
        exports.panesElt.style.pointerEvents = "";
        document.removeEventListener("mouseup", restorePanesMouseEvent);
    }
    tabsBarElt.addEventListener("mousedown", (event) => {
        exports.panesElt.style.pointerEvents = "none";
        document.addEventListener("mouseup", restorePanesMouseEvent);
    });
}
exports.start = start;
function onActivate(tabElement) {
    const activeTab = exports.tabStrip.tabsRoot.querySelector(".active");
    if (activeTab === tabElement)
        return;
    if (activeTab != null) {
        activeTab.classList.remove("active");
        const activePaneElt = exports.panesElt.querySelector(".pane-container.active");
        activePaneElt.classList.remove("active");
        const activeIframe = activePaneElt.querySelector("iframe");
        activeIframe.contentWindow.postMessage({ type: "deactivate" }, window.location.origin);
    }
    tabElement.classList.add("active");
    tabElement.classList.remove("unread");
    const assetId = tabElement.dataset["assetId"];
    let paneElt;
    if (assetId != null)
        paneElt = exports.panesElt.querySelector(`.pane-container[data-asset-id='${assetId}']`);
    else
        paneElt = exports.panesElt.querySelector(`.pane-container[data-name='${tabElement.dataset["pane"]}']`);
    paneElt.classList.add("active");
    const iframe = paneElt.querySelector("iframe");
    iframe.contentWindow.focus();
    iframe.contentWindow.postMessage({ type: "activate" }, window.location.origin);
}
exports.onActivate = onActivate;
function onClose(tabElement) {
    if (tabElement == null)
        tabElement = exports.tabStrip.tabsRoot.querySelector(".active");
    const assetId = tabElement.dataset["assetId"];
    let paneElt;
    if (assetId != null)
        paneElt = exports.panesElt.querySelector(`.pane-container[data-asset-id='${assetId}']`);
    else {
        if (tabElement.classList.contains("pinned"))
            return;
        paneElt = exports.panesElt.querySelector(`.pane-container[data-name='${tabElement.dataset["pane"]}']`);
    }
    if (tabElement.classList.contains("active")) {
        const activeTabElement = (tabElement.nextElementSibling != null) ? tabElement.nextElementSibling : tabElement.previousElementSibling;
        if (activeTabElement != null)
            onActivate(activeTabElement);
    }
    tabElement.parentElement.removeChild(tabElement);
    paneElt.parentElement.removeChild(paneElt);
}
exports.onClose = onClose;
function onActivatePrevious() {
    const activeTabElt = exports.tabStrip.tabsRoot.querySelector(".active");
    for (let tabIndex = 0; exports.tabStrip.tabsRoot.children.length; tabIndex++) {
        const tabElt = exports.tabStrip.tabsRoot.children[tabIndex];
        if (tabElt === activeTabElt) {
            const newTabIndex = (tabIndex === 0) ? exports.tabStrip.tabsRoot.children.length - 1 : tabIndex - 1;
            onActivate(exports.tabStrip.tabsRoot.children[newTabIndex]);
            return;
        }
    }
}
exports.onActivatePrevious = onActivatePrevious;
function onActivateNext() {
    const activeTabElt = exports.tabStrip.tabsRoot.querySelector(".active");
    for (let tabIndex = 0; exports.tabStrip.tabsRoot.children.length; tabIndex++) {
        const tabElt = exports.tabStrip.tabsRoot.children[tabIndex];
        if (tabElt === activeTabElt) {
            const newTabIndex = (tabIndex === exports.tabStrip.tabsRoot.children.length - 1) ? 0 : tabIndex + 1;
            onActivate(exports.tabStrip.tabsRoot.children[newTabIndex]);
            return;
        }
    }
}
exports.onActivateNext = onActivateNext;

},{"tab-strip":18}],12:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const async = require("async");
const sidebar = require("../sidebar");
const tabs = require("./");
const homeTab = require("./homeTab");
const toolsElt = document.querySelector(".sidebar .tools ul");
function setup(toolPaths, callback) {
    exports.toolsByName = {};
    const pluginsRoot = `/systems/${SupCore.system.id}/plugins`;
    async.each(Object.keys(toolPaths), (toolName, cb) => {
        const toolTitle = SupClient.i18n.t(`${toolPaths[toolName]}:editors.${toolName}.title`);
        const pluginPath = toolPaths[toolName];
        exports.toolsByName[toolName] = { title: toolTitle, pluginPath, pinned: false };
        SupClient.fetch(`${pluginsRoot}/${pluginPath}/editors/${toolName}/manifest.json`, "json", (err, toolManifest) => {
            if (err != null) {
                cb(err);
                return;
            }
            exports.toolsByName[toolName].pinned = toolManifest.pinned;
            cb();
        });
    }, (err) => {
        if (err != null) {
            callback(err);
            return;
        }
        toolsElt.innerHTML = "";
        const toolNames = Object.keys(exports.toolsByName);
        toolNames.sort((a, b) => exports.toolsByName[a].title.localeCompare(exports.toolsByName[b].title));
        for (const toolName of toolNames)
            setupTool(toolName);
        callback();
    });
}
exports.setup = setup;
function setupTool(toolName) {
    const tool = exports.toolsByName[toolName];
    if (tool.pinned && SupClient.query.asset == null && SupClient.query["tool"] == null) {
        open(toolName);
        return;
    }
    const toolElt = SupClient.html("li", { parent: toolsElt, dataset: { name: toolName } });
    toolElt.addEventListener("mouseenter", (event) => { event.target.appendChild(sidebar.openInNewWindowButton); });
    toolElt.addEventListener("mouseleave", (event) => {
        if (sidebar.openInNewWindowButton.parentElement != null)
            sidebar.openInNewWindowButton.parentElement.removeChild(sidebar.openInNewWindowButton);
    });
    const containerElt = SupClient.html("div", { parent: toolElt });
    SupClient.html("img", { parent: containerElt, src: `/systems/${SupCore.system.id}/plugins/${tool.pluginPath}/editors/${toolName}/icon.svg` });
    const nameSpanElt = SupClient.html("span", "name", { parent: containerElt, textContent: SupClient.i18n.t(`${tool.pluginPath}:editors.${toolName}.title`) });
    nameSpanElt.addEventListener("click", (event) => { open(event.target.parentElement.parentElement.dataset["name"]); });
}
function open(name, state) {
    let tab = tabs.tabStrip.tabsRoot.querySelector(`li[data-pane='${name}']`);
    if (tab == null) {
        const tool = exports.toolsByName[name];
        tab = createTabElement(name, tool);
        if (exports.toolsByName[name].pinned) {
            const toolElt = toolsElt.querySelector(`li[data-name="${name}"]`);
            if (toolElt != null)
                toolElt.parentElement.removeChild(toolElt);
            const firstUnpinnedTab = tabs.tabStrip.tabsRoot.querySelector("li:not(.pinned)");
            tabs.tabStrip.tabsRoot.insertBefore(tab, firstUnpinnedTab);
        }
        else {
            tabs.tabStrip.tabsRoot.appendChild(tab);
        }
        const paneElt = SupClient.html("div", "pane-container", { parent: tabs.panesElt, dataset: { name } });
        const src = `/systems/${SupCore.system.id}/plugins/${tool.pluginPath}/editors/${name}/?project=${SupClient.query.project}`;
        const iframe = SupClient.html("iframe", { parent: paneElt, src });
        if (state != null)
            iframe.addEventListener("load", () => { iframe.contentWindow.postMessage({ type: "setState", state }, window.location.origin); });
    }
    else if (state != null) {
        const iframe = tabs.panesElt.querySelector(`.pane-container[data-name='${name}'] iframe`);
        iframe.contentWindow.postMessage({ type: "setState", state }, window.location.origin);
    }
    tabs.onActivate(tab);
    if (name === "main")
        homeTab.setup(tab);
}
exports.open = open;
function createTabElement(toolName, tool) {
    const tabElt = SupClient.html("li", { dataset: { pane: toolName } });
    tabElt.classList.toggle("pinned", tool.pinned);
    const iconElt = SupClient.html("img", "icon", { parent: tabElt });
    iconElt.src = `/systems/${SupCore.system.id}/plugins/${tool.pluginPath}/editors/${toolName}/icon.svg`;
    if (!tool.pinned) {
        const tabLabel = SupClient.html("div", "label", { parent: tabElt });
        SupClient.html("div", "name", { parent: tabLabel, textContent: SupClient.i18n.t(`${tool.pluginPath}:editors.${toolName}.title`) });
        const closeButton = SupClient.html("button", "close", { parent: tabElt });
        closeButton.addEventListener("click", () => { tabs.onClose(tabElt); });
    }
    return tabElt;
}

},{"../sidebar":8,"./":11,"./homeTab":10,"async":13}],13:[function(require,module,exports){
(function (process,global,setImmediate){
/*!
 * async
 * https://github.com/caolan/async
 *
 * Copyright 2010-2014 Caolan McMahon
 * Released under the MIT license
 */
(function () {

    var async = {};
    function noop() {}
    function identity(v) {
        return v;
    }
    function toBool(v) {
        return !!v;
    }
    function notId(v) {
        return !v;
    }

    // global on the server, window in the browser
    var previous_async;

    // Establish the root object, `window` (`self`) in the browser, `global`
    // on the server, or `this` in some virtual machines. We use `self`
    // instead of `window` for `WebWorker` support.
    var root = typeof self === 'object' && self.self === self && self ||
            typeof global === 'object' && global.global === global && global ||
            this;

    if (root != null) {
        previous_async = root.async;
    }

    async.noConflict = function () {
        root.async = previous_async;
        return async;
    };

    function only_once(fn) {
        return function() {
            if (fn === null) throw new Error("Callback was already called.");
            fn.apply(this, arguments);
            fn = null;
        };
    }

    function _once(fn) {
        return function() {
            if (fn === null) return;
            fn.apply(this, arguments);
            fn = null;
        };
    }

    //// cross-browser compatiblity functions ////

    var _toString = Object.prototype.toString;

    var _isArray = Array.isArray || function (obj) {
        return _toString.call(obj) === '[object Array]';
    };

    // Ported from underscore.js isObject
    var _isObject = function(obj) {
        var type = typeof obj;
        return type === 'function' || type === 'object' && !!obj;
    };

    function _isArrayLike(arr) {
        return _isArray(arr) || (
            // has a positive integer length property
            typeof arr.length === "number" &&
            arr.length >= 0 &&
            arr.length % 1 === 0
        );
    }

    function _arrayEach(arr, iterator) {
        var index = -1,
            length = arr.length;

        while (++index < length) {
            iterator(arr[index], index, arr);
        }
    }

    function _map(arr, iterator) {
        var index = -1,
            length = arr.length,
            result = Array(length);

        while (++index < length) {
            result[index] = iterator(arr[index], index, arr);
        }
        return result;
    }

    function _range(count) {
        return _map(Array(count), function (v, i) { return i; });
    }

    function _reduce(arr, iterator, memo) {
        _arrayEach(arr, function (x, i, a) {
            memo = iterator(memo, x, i, a);
        });
        return memo;
    }

    function _forEachOf(object, iterator) {
        _arrayEach(_keys(object), function (key) {
            iterator(object[key], key);
        });
    }

    function _indexOf(arr, item) {
        for (var i = 0; i < arr.length; i++) {
            if (arr[i] === item) return i;
        }
        return -1;
    }

    var _keys = Object.keys || function (obj) {
        var keys = [];
        for (var k in obj) {
            if (obj.hasOwnProperty(k)) {
                keys.push(k);
            }
        }
        return keys;
    };

    function _keyIterator(coll) {
        var i = -1;
        var len;
        var keys;
        if (_isArrayLike(coll)) {
            len = coll.length;
            return function next() {
                i++;
                return i < len ? i : null;
            };
        } else {
            keys = _keys(coll);
            len = keys.length;
            return function next() {
                i++;
                return i < len ? keys[i] : null;
            };
        }
    }

    // Similar to ES6's rest param (http://ariya.ofilabs.com/2013/03/es6-and-rest-parameter.html)
    // This accumulates the arguments passed into an array, after a given index.
    // From underscore.js (https://github.com/jashkenas/underscore/pull/2140).
    function _restParam(func, startIndex) {
        startIndex = startIndex == null ? func.length - 1 : +startIndex;
        return function() {
            var length = Math.max(arguments.length - startIndex, 0);
            var rest = Array(length);
            for (var index = 0; index < length; index++) {
                rest[index] = arguments[index + startIndex];
            }
            switch (startIndex) {
                case 0: return func.call(this, rest);
                case 1: return func.call(this, arguments[0], rest);
            }
            // Currently unused but handle cases outside of the switch statement:
            // var args = Array(startIndex + 1);
            // for (index = 0; index < startIndex; index++) {
            //     args[index] = arguments[index];
            // }
            // args[startIndex] = rest;
            // return func.apply(this, args);
        };
    }

    function _withoutIndex(iterator) {
        return function (value, index, callback) {
            return iterator(value, callback);
        };
    }

    //// exported async module functions ////

    //// nextTick implementation with browser-compatible fallback ////

    // capture the global reference to guard against fakeTimer mocks
    var _setImmediate = typeof setImmediate === 'function' && setImmediate;

    var _delay = _setImmediate ? function(fn) {
        // not a direct alias for IE10 compatibility
        _setImmediate(fn);
    } : function(fn) {
        setTimeout(fn, 0);
    };

    if (typeof process === 'object' && typeof process.nextTick === 'function') {
        async.nextTick = process.nextTick;
    } else {
        async.nextTick = _delay;
    }
    async.setImmediate = _setImmediate ? _delay : async.nextTick;


    async.forEach =
    async.each = function (arr, iterator, callback) {
        return async.eachOf(arr, _withoutIndex(iterator), callback);
    };

    async.forEachSeries =
    async.eachSeries = function (arr, iterator, callback) {
        return async.eachOfSeries(arr, _withoutIndex(iterator), callback);
    };


    async.forEachLimit =
    async.eachLimit = function (arr, limit, iterator, callback) {
        return _eachOfLimit(limit)(arr, _withoutIndex(iterator), callback);
    };

    async.forEachOf =
    async.eachOf = function (object, iterator, callback) {
        callback = _once(callback || noop);
        object = object || [];

        var iter = _keyIterator(object);
        var key, completed = 0;

        while ((key = iter()) != null) {
            completed += 1;
            iterator(object[key], key, only_once(done));
        }

        if (completed === 0) callback(null);

        function done(err) {
            completed--;
            if (err) {
                callback(err);
            }
            // Check key is null in case iterator isn't exhausted
            // and done resolved synchronously.
            else if (key === null && completed <= 0) {
                callback(null);
            }
        }
    };

    async.forEachOfSeries =
    async.eachOfSeries = function (obj, iterator, callback) {
        callback = _once(callback || noop);
        obj = obj || [];
        var nextKey = _keyIterator(obj);
        var key = nextKey();
        function iterate() {
            var sync = true;
            if (key === null) {
                return callback(null);
            }
            iterator(obj[key], key, only_once(function (err) {
                if (err) {
                    callback(err);
                }
                else {
                    key = nextKey();
                    if (key === null) {
                        return callback(null);
                    } else {
                        if (sync) {
                            async.setImmediate(iterate);
                        } else {
                            iterate();
                        }
                    }
                }
            }));
            sync = false;
        }
        iterate();
    };



    async.forEachOfLimit =
    async.eachOfLimit = function (obj, limit, iterator, callback) {
        _eachOfLimit(limit)(obj, iterator, callback);
    };

    function _eachOfLimit(limit) {

        return function (obj, iterator, callback) {
            callback = _once(callback || noop);
            obj = obj || [];
            var nextKey = _keyIterator(obj);
            if (limit <= 0) {
                return callback(null);
            }
            var done = false;
            var running = 0;
            var errored = false;

            (function replenish () {
                if (done && running <= 0) {
                    return callback(null);
                }

                while (running < limit && !errored) {
                    var key = nextKey();
                    if (key === null) {
                        done = true;
                        if (running <= 0) {
                            callback(null);
                        }
                        return;
                    }
                    running += 1;
                    iterator(obj[key], key, only_once(function (err) {
                        running -= 1;
                        if (err) {
                            callback(err);
                            errored = true;
                        }
                        else {
                            replenish();
                        }
                    }));
                }
            })();
        };
    }


    function doParallel(fn) {
        return function (obj, iterator, callback) {
            return fn(async.eachOf, obj, iterator, callback);
        };
    }
    function doParallelLimit(fn) {
        return function (obj, limit, iterator, callback) {
            return fn(_eachOfLimit(limit), obj, iterator, callback);
        };
    }
    function doSeries(fn) {
        return function (obj, iterator, callback) {
            return fn(async.eachOfSeries, obj, iterator, callback);
        };
    }

    function _asyncMap(eachfn, arr, iterator, callback) {
        callback = _once(callback || noop);
        arr = arr || [];
        var results = _isArrayLike(arr) ? [] : {};
        eachfn(arr, function (value, index, callback) {
            iterator(value, function (err, v) {
                results[index] = v;
                callback(err);
            });
        }, function (err) {
            callback(err, results);
        });
    }

    async.map = doParallel(_asyncMap);
    async.mapSeries = doSeries(_asyncMap);
    async.mapLimit = doParallelLimit(_asyncMap);

    // reduce only has a series version, as doing reduce in parallel won't
    // work in many situations.
    async.inject =
    async.foldl =
    async.reduce = function (arr, memo, iterator, callback) {
        async.eachOfSeries(arr, function (x, i, callback) {
            iterator(memo, x, function (err, v) {
                memo = v;
                callback(err);
            });
        }, function (err) {
            callback(err, memo);
        });
    };

    async.foldr =
    async.reduceRight = function (arr, memo, iterator, callback) {
        var reversed = _map(arr, identity).reverse();
        async.reduce(reversed, memo, iterator, callback);
    };

    async.transform = function (arr, memo, iterator, callback) {
        if (arguments.length === 3) {
            callback = iterator;
            iterator = memo;
            memo = _isArray(arr) ? [] : {};
        }

        async.eachOf(arr, function(v, k, cb) {
            iterator(memo, v, k, cb);
        }, function(err) {
            callback(err, memo);
        });
    };

    function _filter(eachfn, arr, iterator, callback) {
        var results = [];
        eachfn(arr, function (x, index, callback) {
            iterator(x, function (v) {
                if (v) {
                    results.push({index: index, value: x});
                }
                callback();
            });
        }, function () {
            callback(_map(results.sort(function (a, b) {
                return a.index - b.index;
            }), function (x) {
                return x.value;
            }));
        });
    }

    async.select =
    async.filter = doParallel(_filter);

    async.selectLimit =
    async.filterLimit = doParallelLimit(_filter);

    async.selectSeries =
    async.filterSeries = doSeries(_filter);

    function _reject(eachfn, arr, iterator, callback) {
        _filter(eachfn, arr, function(value, cb) {
            iterator(value, function(v) {
                cb(!v);
            });
        }, callback);
    }
    async.reject = doParallel(_reject);
    async.rejectLimit = doParallelLimit(_reject);
    async.rejectSeries = doSeries(_reject);

    function _createTester(eachfn, check, getResult) {
        return function(arr, limit, iterator, cb) {
            function done() {
                if (cb) cb(getResult(false, void 0));
            }
            function iteratee(x, _, callback) {
                if (!cb) return callback();
                iterator(x, function (v) {
                    if (cb && check(v)) {
                        cb(getResult(true, x));
                        cb = iterator = false;
                    }
                    callback();
                });
            }
            if (arguments.length > 3) {
                eachfn(arr, limit, iteratee, done);
            } else {
                cb = iterator;
                iterator = limit;
                eachfn(arr, iteratee, done);
            }
        };
    }

    async.any =
    async.some = _createTester(async.eachOf, toBool, identity);

    async.someLimit = _createTester(async.eachOfLimit, toBool, identity);

    async.all =
    async.every = _createTester(async.eachOf, notId, notId);

    async.everyLimit = _createTester(async.eachOfLimit, notId, notId);

    function _findGetResult(v, x) {
        return x;
    }
    async.detect = _createTester(async.eachOf, identity, _findGetResult);
    async.detectSeries = _createTester(async.eachOfSeries, identity, _findGetResult);
    async.detectLimit = _createTester(async.eachOfLimit, identity, _findGetResult);

    async.sortBy = function (arr, iterator, callback) {
        async.map(arr, function (x, callback) {
            iterator(x, function (err, criteria) {
                if (err) {
                    callback(err);
                }
                else {
                    callback(null, {value: x, criteria: criteria});
                }
            });
        }, function (err, results) {
            if (err) {
                return callback(err);
            }
            else {
                callback(null, _map(results.sort(comparator), function (x) {
                    return x.value;
                }));
            }

        });

        function comparator(left, right) {
            var a = left.criteria, b = right.criteria;
            return a < b ? -1 : a > b ? 1 : 0;
        }
    };

    async.auto = function (tasks, concurrency, callback) {
        if (typeof arguments[1] === 'function') {
            // concurrency is optional, shift the args.
            callback = concurrency;
            concurrency = null;
        }
        callback = _once(callback || noop);
        var keys = _keys(tasks);
        var remainingTasks = keys.length;
        if (!remainingTasks) {
            return callback(null);
        }
        if (!concurrency) {
            concurrency = remainingTasks;
        }

        var results = {};
        var runningTasks = 0;

        var hasError = false;

        var listeners = [];
        function addListener(fn) {
            listeners.unshift(fn);
        }
        function removeListener(fn) {
            var idx = _indexOf(listeners, fn);
            if (idx >= 0) listeners.splice(idx, 1);
        }
        function taskComplete() {
            remainingTasks--;
            _arrayEach(listeners.slice(0), function (fn) {
                fn();
            });
        }

        addListener(function () {
            if (!remainingTasks) {
                callback(null, results);
            }
        });

        _arrayEach(keys, function (k) {
            if (hasError) return;
            var task = _isArray(tasks[k]) ? tasks[k]: [tasks[k]];
            var taskCallback = _restParam(function(err, args) {
                runningTasks--;
                if (args.length <= 1) {
                    args = args[0];
                }
                if (err) {
                    var safeResults = {};
                    _forEachOf(results, function(val, rkey) {
                        safeResults[rkey] = val;
                    });
                    safeResults[k] = args;
                    hasError = true;

                    callback(err, safeResults);
                }
                else {
                    results[k] = args;
                    async.setImmediate(taskComplete);
                }
            });
            var requires = task.slice(0, task.length - 1);
            // prevent dead-locks
            var len = requires.length;
            var dep;
            while (len--) {
                if (!(dep = tasks[requires[len]])) {
                    throw new Error('Has nonexistent dependency in ' + requires.join(', '));
                }
                if (_isArray(dep) && _indexOf(dep, k) >= 0) {
                    throw new Error('Has cyclic dependencies');
                }
            }
            function ready() {
                return runningTasks < concurrency && _reduce(requires, function (a, x) {
                    return (a && results.hasOwnProperty(x));
                }, true) && !results.hasOwnProperty(k);
            }
            if (ready()) {
                runningTasks++;
                task[task.length - 1](taskCallback, results);
            }
            else {
                addListener(listener);
            }
            function listener() {
                if (ready()) {
                    runningTasks++;
                    removeListener(listener);
                    task[task.length - 1](taskCallback, results);
                }
            }
        });
    };



    async.retry = function(times, task, callback) {
        var DEFAULT_TIMES = 5;
        var DEFAULT_INTERVAL = 0;

        var attempts = [];

        var opts = {
            times: DEFAULT_TIMES,
            interval: DEFAULT_INTERVAL
        };

        function parseTimes(acc, t){
            if(typeof t === 'number'){
                acc.times = parseInt(t, 10) || DEFAULT_TIMES;
            } else if(typeof t === 'object'){
                acc.times = parseInt(t.times, 10) || DEFAULT_TIMES;
                acc.interval = parseInt(t.interval, 10) || DEFAULT_INTERVAL;
            } else {
                throw new Error('Unsupported argument type for \'times\': ' + typeof t);
            }
        }

        var length = arguments.length;
        if (length < 1 || length > 3) {
            throw new Error('Invalid arguments - must be either (task), (task, callback), (times, task) or (times, task, callback)');
        } else if (length <= 2 && typeof times === 'function') {
            callback = task;
            task = times;
        }
        if (typeof times !== 'function') {
            parseTimes(opts, times);
        }
        opts.callback = callback;
        opts.task = task;

        function wrappedTask(wrappedCallback, wrappedResults) {
            function retryAttempt(task, finalAttempt) {
                return function(seriesCallback) {
                    task(function(err, result){
                        seriesCallback(!err || finalAttempt, {err: err, result: result});
                    }, wrappedResults);
                };
            }

            function retryInterval(interval){
                return function(seriesCallback){
                    setTimeout(function(){
                        seriesCallback(null);
                    }, interval);
                };
            }

            while (opts.times) {

                var finalAttempt = !(opts.times-=1);
                attempts.push(retryAttempt(opts.task, finalAttempt));
                if(!finalAttempt && opts.interval > 0){
                    attempts.push(retryInterval(opts.interval));
                }
            }

            async.series(attempts, function(done, data){
                data = data[data.length - 1];
                (wrappedCallback || opts.callback)(data.err, data.result);
            });
        }

        // If a callback is passed, run this as a controll flow
        return opts.callback ? wrappedTask() : wrappedTask;
    };

    async.waterfall = function (tasks, callback) {
        callback = _once(callback || noop);
        if (!_isArray(tasks)) {
            var err = new Error('First argument to waterfall must be an array of functions');
            return callback(err);
        }
        if (!tasks.length) {
            return callback();
        }
        function wrapIterator(iterator) {
            return _restParam(function (err, args) {
                if (err) {
                    callback.apply(null, [err].concat(args));
                }
                else {
                    var next = iterator.next();
                    if (next) {
                        args.push(wrapIterator(next));
                    }
                    else {
                        args.push(callback);
                    }
                    ensureAsync(iterator).apply(null, args);
                }
            });
        }
        wrapIterator(async.iterator(tasks))();
    };

    function _parallel(eachfn, tasks, callback) {
        callback = callback || noop;
        var results = _isArrayLike(tasks) ? [] : {};

        eachfn(tasks, function (task, key, callback) {
            task(_restParam(function (err, args) {
                if (args.length <= 1) {
                    args = args[0];
                }
                results[key] = args;
                callback(err);
            }));
        }, function (err) {
            callback(err, results);
        });
    }

    async.parallel = function (tasks, callback) {
        _parallel(async.eachOf, tasks, callback);
    };

    async.parallelLimit = function(tasks, limit, callback) {
        _parallel(_eachOfLimit(limit), tasks, callback);
    };

    async.series = function(tasks, callback) {
        _parallel(async.eachOfSeries, tasks, callback);
    };

    async.iterator = function (tasks) {
        function makeCallback(index) {
            function fn() {
                if (tasks.length) {
                    tasks[index].apply(null, arguments);
                }
                return fn.next();
            }
            fn.next = function () {
                return (index < tasks.length - 1) ? makeCallback(index + 1): null;
            };
            return fn;
        }
        return makeCallback(0);
    };

    async.apply = _restParam(function (fn, args) {
        return _restParam(function (callArgs) {
            return fn.apply(
                null, args.concat(callArgs)
            );
        });
    });

    function _concat(eachfn, arr, fn, callback) {
        var result = [];
        eachfn(arr, function (x, index, cb) {
            fn(x, function (err, y) {
                result = result.concat(y || []);
                cb(err);
            });
        }, function (err) {
            callback(err, result);
        });
    }
    async.concat = doParallel(_concat);
    async.concatSeries = doSeries(_concat);

    async.whilst = function (test, iterator, callback) {
        callback = callback || noop;
        if (test()) {
            var next = _restParam(function(err, args) {
                if (err) {
                    callback(err);
                } else if (test.apply(this, args)) {
                    iterator(next);
                } else {
                    callback.apply(null, [null].concat(args));
                }
            });
            iterator(next);
        } else {
            callback(null);
        }
    };

    async.doWhilst = function (iterator, test, callback) {
        var calls = 0;
        return async.whilst(function() {
            return ++calls <= 1 || test.apply(this, arguments);
        }, iterator, callback);
    };

    async.until = function (test, iterator, callback) {
        return async.whilst(function() {
            return !test.apply(this, arguments);
        }, iterator, callback);
    };

    async.doUntil = function (iterator, test, callback) {
        return async.doWhilst(iterator, function() {
            return !test.apply(this, arguments);
        }, callback);
    };

    async.during = function (test, iterator, callback) {
        callback = callback || noop;

        var next = _restParam(function(err, args) {
            if (err) {
                callback(err);
            } else {
                args.push(check);
                test.apply(this, args);
            }
        });

        var check = function(err, truth) {
            if (err) {
                callback(err);
            } else if (truth) {
                iterator(next);
            } else {
                callback(null);
            }
        };

        test(check);
    };

    async.doDuring = function (iterator, test, callback) {
        var calls = 0;
        async.during(function(next) {
            if (calls++ < 1) {
                next(null, true);
            } else {
                test.apply(this, arguments);
            }
        }, iterator, callback);
    };

    function _queue(worker, concurrency, payload) {
        if (concurrency == null) {
            concurrency = 1;
        }
        else if(concurrency === 0) {
            throw new Error('Concurrency must not be zero');
        }
        function _insert(q, data, pos, callback) {
            if (callback != null && typeof callback !== "function") {
                throw new Error("task callback must be a function");
            }
            q.started = true;
            if (!_isArray(data)) {
                data = [data];
            }
            if(data.length === 0 && q.idle()) {
                // call drain immediately if there are no tasks
                return async.setImmediate(function() {
                    q.drain();
                });
            }
            _arrayEach(data, function(task) {
                var item = {
                    data: task,
                    callback: callback || noop
                };

                if (pos) {
                    q.tasks.unshift(item);
                } else {
                    q.tasks.push(item);
                }

                if (q.tasks.length === q.concurrency) {
                    q.saturated();
                }
            });
            async.setImmediate(q.process);
        }
        function _next(q, tasks) {
            return function(){
                workers -= 1;

                var removed = false;
                var args = arguments;
                _arrayEach(tasks, function (task) {
                    _arrayEach(workersList, function (worker, index) {
                        if (worker === task && !removed) {
                            workersList.splice(index, 1);
                            removed = true;
                        }
                    });

                    task.callback.apply(task, args);
                });
                if (q.tasks.length + workers === 0) {
                    q.drain();
                }
                q.process();
            };
        }

        var workers = 0;
        var workersList = [];
        var q = {
            tasks: [],
            concurrency: concurrency,
            payload: payload,
            saturated: noop,
            empty: noop,
            drain: noop,
            started: false,
            paused: false,
            push: function (data, callback) {
                _insert(q, data, false, callback);
            },
            kill: function () {
                q.drain = noop;
                q.tasks = [];
            },
            unshift: function (data, callback) {
                _insert(q, data, true, callback);
            },
            process: function () {
                while(!q.paused && workers < q.concurrency && q.tasks.length){

                    var tasks = q.payload ?
                        q.tasks.splice(0, q.payload) :
                        q.tasks.splice(0, q.tasks.length);

                    var data = _map(tasks, function (task) {
                        return task.data;
                    });

                    if (q.tasks.length === 0) {
                        q.empty();
                    }
                    workers += 1;
                    workersList.push(tasks[0]);
                    var cb = only_once(_next(q, tasks));
                    worker(data, cb);
                }
            },
            length: function () {
                return q.tasks.length;
            },
            running: function () {
                return workers;
            },
            workersList: function () {
                return workersList;
            },
            idle: function() {
                return q.tasks.length + workers === 0;
            },
            pause: function () {
                q.paused = true;
            },
            resume: function () {
                if (q.paused === false) { return; }
                q.paused = false;
                var resumeCount = Math.min(q.concurrency, q.tasks.length);
                // Need to call q.process once per concurrent
                // worker to preserve full concurrency after pause
                for (var w = 1; w <= resumeCount; w++) {
                    async.setImmediate(q.process);
                }
            }
        };
        return q;
    }

    async.queue = function (worker, concurrency) {
        var q = _queue(function (items, cb) {
            worker(items[0], cb);
        }, concurrency, 1);

        return q;
    };

    async.priorityQueue = function (worker, concurrency) {

        function _compareTasks(a, b){
            return a.priority - b.priority;
        }

        function _binarySearch(sequence, item, compare) {
            var beg = -1,
                end = sequence.length - 1;
            while (beg < end) {
                var mid = beg + ((end - beg + 1) >>> 1);
                if (compare(item, sequence[mid]) >= 0) {
                    beg = mid;
                } else {
                    end = mid - 1;
                }
            }
            return beg;
        }

        function _insert(q, data, priority, callback) {
            if (callback != null && typeof callback !== "function") {
                throw new Error("task callback must be a function");
            }
            q.started = true;
            if (!_isArray(data)) {
                data = [data];
            }
            if(data.length === 0) {
                // call drain immediately if there are no tasks
                return async.setImmediate(function() {
                    q.drain();
                });
            }
            _arrayEach(data, function(task) {
                var item = {
                    data: task,
                    priority: priority,
                    callback: typeof callback === 'function' ? callback : noop
                };

                q.tasks.splice(_binarySearch(q.tasks, item, _compareTasks) + 1, 0, item);

                if (q.tasks.length === q.concurrency) {
                    q.saturated();
                }
                async.setImmediate(q.process);
            });
        }

        // Start with a normal queue
        var q = async.queue(worker, concurrency);

        // Override push to accept second parameter representing priority
        q.push = function (data, priority, callback) {
            _insert(q, data, priority, callback);
        };

        // Remove unshift function
        delete q.unshift;

        return q;
    };

    async.cargo = function (worker, payload) {
        return _queue(worker, 1, payload);
    };

    function _console_fn(name) {
        return _restParam(function (fn, args) {
            fn.apply(null, args.concat([_restParam(function (err, args) {
                if (typeof console === 'object') {
                    if (err) {
                        if (console.error) {
                            console.error(err);
                        }
                    }
                    else if (console[name]) {
                        _arrayEach(args, function (x) {
                            console[name](x);
                        });
                    }
                }
            })]));
        });
    }
    async.log = _console_fn('log');
    async.dir = _console_fn('dir');
    /*async.info = _console_fn('info');
    async.warn = _console_fn('warn');
    async.error = _console_fn('error');*/

    async.memoize = function (fn, hasher) {
        var memo = {};
        var queues = {};
        var has = Object.prototype.hasOwnProperty;
        hasher = hasher || identity;
        var memoized = _restParam(function memoized(args) {
            var callback = args.pop();
            var key = hasher.apply(null, args);
            if (has.call(memo, key)) {   
                async.setImmediate(function () {
                    callback.apply(null, memo[key]);
                });
            }
            else if (has.call(queues, key)) {
                queues[key].push(callback);
            }
            else {
                queues[key] = [callback];
                fn.apply(null, args.concat([_restParam(function (args) {
                    memo[key] = args;
                    var q = queues[key];
                    delete queues[key];
                    for (var i = 0, l = q.length; i < l; i++) {
                        q[i].apply(null, args);
                    }
                })]));
            }
        });
        memoized.memo = memo;
        memoized.unmemoized = fn;
        return memoized;
    };

    async.unmemoize = function (fn) {
        return function () {
            return (fn.unmemoized || fn).apply(null, arguments);
        };
    };

    function _times(mapper) {
        return function (count, iterator, callback) {
            mapper(_range(count), iterator, callback);
        };
    }

    async.times = _times(async.map);
    async.timesSeries = _times(async.mapSeries);
    async.timesLimit = function (count, limit, iterator, callback) {
        return async.mapLimit(_range(count), limit, iterator, callback);
    };

    async.seq = function (/* functions... */) {
        var fns = arguments;
        return _restParam(function (args) {
            var that = this;

            var callback = args[args.length - 1];
            if (typeof callback == 'function') {
                args.pop();
            } else {
                callback = noop;
            }

            async.reduce(fns, args, function (newargs, fn, cb) {
                fn.apply(that, newargs.concat([_restParam(function (err, nextargs) {
                    cb(err, nextargs);
                })]));
            },
            function (err, results) {
                callback.apply(that, [err].concat(results));
            });
        });
    };

    async.compose = function (/* functions... */) {
        return async.seq.apply(null, Array.prototype.reverse.call(arguments));
    };


    function _applyEach(eachfn) {
        return _restParam(function(fns, args) {
            var go = _restParam(function(args) {
                var that = this;
                var callback = args.pop();
                return eachfn(fns, function (fn, _, cb) {
                    fn.apply(that, args.concat([cb]));
                },
                callback);
            });
            if (args.length) {
                return go.apply(this, args);
            }
            else {
                return go;
            }
        });
    }

    async.applyEach = _applyEach(async.eachOf);
    async.applyEachSeries = _applyEach(async.eachOfSeries);


    async.forever = function (fn, callback) {
        var done = only_once(callback || noop);
        var task = ensureAsync(fn);
        function next(err) {
            if (err) {
                return done(err);
            }
            task(next);
        }
        next();
    };

    function ensureAsync(fn) {
        return _restParam(function (args) {
            var callback = args.pop();
            args.push(function () {
                var innerArgs = arguments;
                if (sync) {
                    async.setImmediate(function () {
                        callback.apply(null, innerArgs);
                    });
                } else {
                    callback.apply(null, innerArgs);
                }
            });
            var sync = true;
            fn.apply(this, args);
            sync = false;
        });
    }

    async.ensureAsync = ensureAsync;

    async.constant = _restParam(function(values) {
        var args = [null].concat(values);
        return function (callback) {
            return callback.apply(this, args);
        };
    });

    async.wrapSync =
    async.asyncify = function asyncify(func) {
        return _restParam(function (args) {
            var callback = args.pop();
            var result;
            try {
                result = func.apply(this, args);
            } catch (e) {
                return callback(e);
            }
            // if result is Promise object
            if (_isObject(result) && typeof result.then === "function") {
                result.then(function(value) {
                    callback(null, value);
                })["catch"](function(err) {
                    callback(err.message ? err : new Error(err));
                });
            } else {
                callback(null, result);
            }
        });
    };

    // Node.js
    if (typeof module === 'object' && module.exports) {
        module.exports = async;
    }
    // AMD / RequireJS
    else if (typeof define === 'function' && define.amd) {
        define([], function () {
            return async;
        });
    }
    // included directly via <script> tag
    else {
        root.async = async;
    }

}());

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("timers").setImmediate)
},{"_process":16,"timers":19}],14:[function(require,module,exports){
(function (global){
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.TreeView = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        // At least give some kind of context to the user
        var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
        err.context = er;
        throw err;
      }
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function(emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],2:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var events_1 = require("events");
var TreeView = (function (_super) {
    __extends(TreeView, _super);
    function TreeView(container, options) {
        var _this = this;
        _super.call(this);
        this.onClick = function (event) {
            // Toggle groups
            var element = event.target;
            if (element.className === "toggle") {
                if (element.parentElement.tagName === "LI" && element.parentElement.classList.contains("group")) {
                    element.parentElement.classList.toggle("collapsed");
                    return;
                }
            }
            // Update selection
            if (element.tagName === "BUTTON" || element.tagName === "INPUT" || element.tagName === "SELECT")
                return;
            if (_this.updateSelection(event))
                _this.emit("selectionChange");
        };
        this.onDoubleClick = function (event) {
            if (_this.selectedNodes.length !== 1)
                return;
            var element = event.target;
            if (element.tagName === "BUTTON" || element.tagName === "INPUT" || element.tagName === "SELECT")
                return;
            if (element.className === "toggle")
                return;
            _this.emit("activate");
        };
        this.onKeyDown = function (event) {
            if (document.activeElement !== _this.treeRoot)
                return;
            if (_this.firstSelectedNode == null) {
                // TODO: Remove once we have this.focusedNode
                if (event.keyCode === 40) {
                    _this.addToSelection(_this.treeRoot.firstElementChild);
                    _this.emit("selectionChange");
                    event.preventDefault();
                }
                return;
            }
            switch (event.keyCode) {
                case 38: // up
                case 40:
                    _this.moveVertically(event.keyCode === 40 ? 1 : -1);
                    event.preventDefault();
                    break;
                case 37: // left
                case 39:
                    _this.moveHorizontally(event.keyCode === 39 ? 1 : -1);
                    event.preventDefault();
                    break;
                case 13:
                    if (_this.selectedNodes.length !== 1)
                        return;
                    _this.emit("activate");
                    event.preventDefault();
                    break;
            }
        };
        this.moveHorizontally = function (offset) {
            // TODO: this.focusedNode;
            var node = _this.firstSelectedNode;
            if (offset === -1) {
                if (!node.classList.contains("group") || node.classList.contains("collapsed")) {
                    if (!node.parentElement.classList.contains("children"))
                        return;
                    node = node.parentElement.previousElementSibling;
                }
                else if (node.classList.contains("group")) {
                    node.classList.add("collapsed");
                }
            }
            else {
                if (node.classList.contains("group")) {
                    if (node.classList.contains("collapsed"))
                        node.classList.remove("collapsed");
                    else
                        node = node.nextSibling.firstChild;
                }
            }
            if (node == null)
                return;
            _this.clearSelection();
            _this.addToSelection(node);
            _this.scrollIntoView(node);
            _this.emit("selectionChange");
        };
        this.onDragStart = function (event) {
            var element = event.target;
            if (element.tagName !== "LI")
                return false;
            if (!element.classList.contains("item") && !element.classList.contains("group"))
                return false;
            if (_this.selectedNodes.indexOf(element) === -1) {
                _this.clearSelection();
                _this.addToSelection(element);
                _this.emit("selectionChange");
            }
            if (_this.dragStartCallback != null && !_this.dragStartCallback(event, element))
                return false;
            _this.isDraggingNodes = true;
            return true;
        };
        this.onDragEnd = function (event) {
            _this.isDraggingNodes = false;
        };
        this.onDragOver = function (event) {
            var dropLocation = _this.getDropLocation(event);
            // Prevent dropping onto null
            if (dropLocation == null)
                return false;
            // If we're dragging nodes from the current tree view
            // Prevent dropping into descendant
            if (_this.isDraggingNodes) {
                if (dropLocation.where === "inside" && _this.selectedNodes.indexOf(dropLocation.target) !== -1)
                    return false;
                for (var _i = 0, _a = _this.selectedNodes; _i < _a.length; _i++) {
                    var selectedNode = _a[_i];
                    if (selectedNode.classList.contains("group") && selectedNode.nextSibling.contains(dropLocation.target))
                        return false;
                }
            }
            _this.hasDraggedOverAfterLeaving = true;
            _this.clearDropClasses();
            dropLocation.target.classList.add("drop-" + dropLocation.where);
            event.preventDefault();
        };
        this.onDragLeave = function (event) {
            _this.hasDraggedOverAfterLeaving = false;
            setTimeout(function () { if (!_this.hasDraggedOverAfterLeaving)
                _this.clearDropClasses(); }, 300);
        };
        this.onDrop = function (event) {
            event.preventDefault();
            var dropLocation = _this.getDropLocation(event);
            if (dropLocation == null)
                return;
            _this.clearDropClasses();
            if (!_this.isDraggingNodes) {
                _this.dropCallback(event, dropLocation, null);
                return false;
            }
            var children = _this.selectedNodes[0].parentElement.children;
            var orderedNodes = [];
            for (var i = 0; i < children.length; i++) {
                var child = children[i];
                if (_this.selectedNodes.indexOf(child) !== -1)
                    orderedNodes.push(child);
            }
            var reparent = (_this.dropCallback != null) ? _this.dropCallback(event, dropLocation, orderedNodes) : true;
            if (!reparent)
                return;
            var newParent;
            var referenceElt;
            switch (dropLocation.where) {
                case "inside":
                    if (!dropLocation.target.classList.contains("group"))
                        return;
                    newParent = dropLocation.target.nextSibling;
                    referenceElt = null;
                    break;
                case "below":
                    newParent = dropLocation.target.parentElement;
                    referenceElt = dropLocation.target.nextSibling;
                    if (referenceElt != null && referenceElt.tagName === "OL")
                        referenceElt = referenceElt.nextSibling;
                    break;
                case "above":
                    newParent = dropLocation.target.parentElement;
                    referenceElt = dropLocation.target;
                    break;
            }
            var draggedChildren;
            for (var _i = 0, orderedNodes_1 = orderedNodes; _i < orderedNodes_1.length; _i++) {
                var selectedNode = orderedNodes_1[_i];
                if (selectedNode.classList.contains("group")) {
                    draggedChildren = selectedNode.nextSibling;
                    draggedChildren.parentElement.removeChild(draggedChildren);
                }
                if (referenceElt === selectedNode) {
                    referenceElt = selectedNode.nextSibling;
                }
                selectedNode.parentElement.removeChild(selectedNode);
                newParent.insertBefore(selectedNode, referenceElt);
                referenceElt = selectedNode.nextSibling;
                if (draggedChildren != null) {
                    newParent.insertBefore(draggedChildren, referenceElt);
                    referenceElt = draggedChildren.nextSibling;
                }
            }
        };
        if (options == null)
            options = {};
        this.multipleSelection = (options.multipleSelection != null) ? options.multipleSelection : true;
        this.dragStartCallback = options.dragStartCallback;
        this.dropCallback = options.dropCallback;
        this.treeRoot = document.createElement("ol");
        this.treeRoot.tabIndex = 0;
        this.treeRoot.classList.add("tree");
        container.appendChild(this.treeRoot);
        this.selectedNodes = [];
        this.firstSelectedNode = null;
        this.treeRoot.addEventListener("click", this.onClick);
        this.treeRoot.addEventListener("dblclick", this.onDoubleClick);
        this.treeRoot.addEventListener("keydown", this.onKeyDown);
        container.addEventListener("keydown", function (event) {
            if (event.keyCode === 37 || event.keyCode === 39)
                event.preventDefault();
        });
        if (this.dragStartCallback != null) {
            this.treeRoot.addEventListener("dragstart", this.onDragStart);
            this.treeRoot.addEventListener("dragend", this.onDragEnd);
        }
        if (this.dropCallback != null) {
            this.treeRoot.addEventListener("dragover", this.onDragOver);
            this.treeRoot.addEventListener("dragleave", this.onDragLeave);
            this.treeRoot.addEventListener("drop", this.onDrop);
        }
    }
    TreeView.prototype.clearSelection = function () {
        for (var _i = 0, _a = this.selectedNodes; _i < _a.length; _i++) {
            var selectedNode = _a[_i];
            selectedNode.classList.remove("selected");
        }
        this.selectedNodes.length = 0;
        this.firstSelectedNode = null;
    };
    TreeView.prototype.addToSelection = function (element) {
        if (this.selectedNodes.indexOf(element) !== -1)
            return;
        this.selectedNodes.push(element);
        element.classList.add("selected");
        if (this.selectedNodes.length === 1)
            this.firstSelectedNode = element;
    };
    TreeView.prototype.scrollIntoView = function (element) {
        var ancestor = element.parentElement;
        while (ancestor != null && ancestor.className === "children") {
            ancestor.previousElementSibling.classList.remove("collapsed");
            ancestor = ancestor.parentElement;
        }
        var elementRect = element.getBoundingClientRect();
        var containerRect = this.treeRoot.parentElement.getBoundingClientRect();
        if (elementRect.top < containerRect.top)
            element.scrollIntoView(true);
        else if (elementRect.bottom > containerRect.bottom)
            element.scrollIntoView(false);
    };
    TreeView.prototype.clear = function () {
        this.treeRoot.innerHTML = "";
        this.selectedNodes.length = 0;
        this.firstSelectedNode = null;
        this.hasDraggedOverAfterLeaving = false;
        this.isDraggingNodes = false;
    };
    TreeView.prototype.append = function (element, type, parentGroupElement) {
        if (type !== "item" && type !== "group")
            throw new Error("Invalid type");
        var childrenElt;
        var siblingsElt;
        if (parentGroupElement != null) {
            if (parentGroupElement.tagName !== "LI" || !parentGroupElement.classList.contains("group"))
                throw new Error("Invalid parent group");
            siblingsElt = parentGroupElement.nextSibling;
        }
        else {
            siblingsElt = this.treeRoot;
        }
        if (!element.classList.contains(type)) {
            element.classList.add(type);
            if (this.dragStartCallback != null)
                element.draggable = true;
            if (type === "group") {
                var toggleElt = document.createElement("div");
                toggleElt.classList.add("toggle");
                element.insertBefore(toggleElt, element.firstChild);
                childrenElt = document.createElement("ol");
                childrenElt.classList.add("children");
            }
        }
        else if (type === "group") {
            childrenElt = element.nextSibling;
        }
        siblingsElt.appendChild(element);
        if (childrenElt != null)
            siblingsElt.appendChild(childrenElt);
        return element;
    };
    TreeView.prototype.insertBefore = function (element, type, referenceElement) {
        if (type !== "item" && type !== "group")
            throw new Error("Invalid type");
        if (referenceElement == null)
            throw new Error("A reference element is required");
        if (referenceElement.tagName !== "LI")
            throw new Error("Invalid reference element");
        var childrenElt;
        if (!element.classList.contains(type)) {
            element.classList.add(type);
            if (this.dragStartCallback != null)
                element.draggable = true;
            if (type === "group") {
                var toggleElt = document.createElement("div");
                toggleElt.classList.add("toggle");
                element.insertBefore(toggleElt, element.firstChild);
                childrenElt = document.createElement("ol");
                childrenElt.classList.add("children");
            }
        }
        else if (type === "group") {
            childrenElt = element.nextSibling;
        }
        referenceElement.parentElement.insertBefore(element, referenceElement);
        if (childrenElt != null)
            referenceElement.parentElement.insertBefore(childrenElt, element.nextSibling);
        return element;
    };
    TreeView.prototype.insertAt = function (element, type, index, parentElement) {
        var referenceElt;
        if (index != null) {
            referenceElt =
                (parentElement != null)
                    ? parentElement.nextSibling.querySelector(":scope > li:nth-of-type(" + (index + 1) + ")")
                    : this.treeRoot.querySelector(":scope > li:nth-of-type(" + (index + 1) + ")");
        }
        if (referenceElt != null)
            this.insertBefore(element, type, referenceElt);
        else
            this.append(element, type, parentElement);
    };
    TreeView.prototype.remove = function (element) {
        var selectedIndex = this.selectedNodes.indexOf(element);
        if (selectedIndex !== -1) {
            element.classList.remove("selected");
            this.selectedNodes.splice(selectedIndex, 1);
        }
        if (this.firstSelectedNode === element)
            this.firstSelectedNode = this.selectedNodes[0];
        if (element.classList.contains("group")) {
            var childrenElement = element.nextSibling;
            var removedSelectedNodes = [];
            for (var _i = 0, _a = this.selectedNodes; _i < _a.length; _i++) {
                var selectedNode = _a[_i];
                if (childrenElement.contains(selectedNode)) {
                    removedSelectedNodes.push(selectedNode);
                }
            }
            for (var _b = 0, removedSelectedNodes_1 = removedSelectedNodes; _b < removedSelectedNodes_1.length; _b++) {
                var removedSelectedNode = removedSelectedNodes_1[_b];
                removedSelectedNode.classList.remove("selected");
                this.selectedNodes.splice(this.selectedNodes.indexOf(removedSelectedNode), 1);
                if (this.firstSelectedNode === removedSelectedNode)
                    this.firstSelectedNode = this.selectedNodes[0];
            }
            element.parentElement.removeChild(childrenElement);
        }
        element.parentElement.removeChild(element);
    };
    // Returns whether the selection changed
    TreeView.prototype.updateSelection = function (event) {
        var selectionChanged = false;
        if ((!this.multipleSelection || (!event.shiftKey && !event.ctrlKey)) && this.selectedNodes.length > 0) {
            this.clearSelection();
            selectionChanged = true;
        }
        var ancestorElement = event.target;
        while (ancestorElement.tagName !== "LI" || (!ancestorElement.classList.contains("item") && !ancestorElement.classList.contains("group"))) {
            if (ancestorElement === this.treeRoot)
                return selectionChanged;
            ancestorElement = ancestorElement.parentElement;
        }
        var element = ancestorElement;
        if (this.selectedNodes.length > 0 && this.selectedNodes[0].parentElement !== element.parentElement) {
            return selectionChanged;
        }
        if (this.multipleSelection && event.shiftKey && this.selectedNodes.length > 0) {
            var startElement = this.firstSelectedNode;
            var elements = [];
            var inside = false;
            for (var i = 0; i < element.parentElement.children.length; i++) {
                var child = element.parentElement.children[i];
                if (child === startElement || child === element) {
                    if (inside || startElement === element) {
                        elements.push(child);
                        break;
                    }
                    inside = true;
                }
                if (inside && child.tagName === "LI")
                    elements.push(child);
            }
            this.clearSelection();
            this.selectedNodes = elements;
            this.firstSelectedNode = startElement;
            for (var _i = 0, _a = this.selectedNodes; _i < _a.length; _i++) {
                var selectedNode = _a[_i];
                selectedNode.classList.add("selected");
            }
            return true;
        }
        var index;
        if (event.ctrlKey && (index = this.selectedNodes.indexOf(element)) !== -1) {
            this.selectedNodes.splice(index, 1);
            element.classList.remove("selected");
            if (this.firstSelectedNode === element) {
                this.firstSelectedNode = this.selectedNodes[0];
            }
            return true;
        }
        this.addToSelection(element);
        return true;
    };
    TreeView.prototype.moveVertically = function (offset) {
        // TODO: this.focusedNode;
        var node = this.firstSelectedNode;
        if (offset === -1) {
            if (node.previousElementSibling != null) {
                var target = node.previousElementSibling;
                while (target.classList.contains("children")) {
                    if (!target.previousElementSibling.classList.contains("collapsed") && target.childElementCount > 0)
                        target = target.lastElementChild;
                    else
                        target = target.previousElementSibling;
                }
                node = target;
            }
            else if (node.parentElement.classList.contains("children"))
                node = node.parentElement.previousElementSibling;
            else
                return;
        }
        else {
            var walkUp = false;
            if (node.classList.contains("group")) {
                if (!node.classList.contains("collapsed") && node.nextElementSibling.childElementCount > 0)
                    node = node.nextElementSibling.firstElementChild;
                else if (node.nextElementSibling.nextElementSibling != null)
                    node = node.nextElementSibling.nextElementSibling;
                else
                    walkUp = true;
            }
            else {
                if (node.nextElementSibling != null)
                    node = node.nextElementSibling;
                else
                    walkUp = true;
            }
            if (walkUp) {
                if (node.parentElement.classList.contains("children")) {
                    var target = node.parentElement;
                    while (target.nextElementSibling == null) {
                        target = target.parentElement;
                        if (!target.classList.contains("children"))
                            return;
                    }
                    node = target.nextElementSibling;
                }
                else
                    return;
            }
        }
        if (node == null)
            return;
        this.clearSelection();
        this.addToSelection(node);
        this.scrollIntoView(node);
        this.emit("selectionChange");
    };
    ;
    TreeView.prototype.getDropLocation = function (event) {
        var element = event.target;
        if (element.tagName === "OL" && element.classList.contains("children")) {
            element = element.parentElement;
        }
        if (element === this.treeRoot) {
            element = element.lastChild;
            if (element == null)
                return { target: this.treeRoot, where: "inside" };
            if (element.tagName === "OL")
                element = element.previousSibling;
            return { target: element, where: "below" };
        }
        while (element.tagName !== "LI" || (!element.classList.contains("item") && !element.classList.contains("group"))) {
            if (element === this.treeRoot)
                return null;
            element = element.parentElement;
        }
        var where = this.getInsertionPoint(element, event.pageY);
        if (where === "below") {
            if (element.classList.contains("item") && element.nextSibling != null && element.nextSibling.tagName === "LI") {
                element = element.nextSibling;
                where = "above";
            }
            else if (element.classList.contains("group") && element.nextSibling.nextSibling != null && element.nextSibling.nextSibling.tagName === "LI") {
                element = element.nextSibling.nextSibling;
                where = "above";
            }
        }
        return { target: element, where: where };
    };
    TreeView.prototype.getInsertionPoint = function (element, y) {
        var rect = element.getBoundingClientRect();
        var offset = y - rect.top;
        if (offset < rect.height / 4)
            return "above";
        if (offset > rect.height * 3 / 4)
            return (element.classList.contains("group") && element.nextSibling.childElementCount > 0) ? "inside" : "below";
        return element.classList.contains("item") ? "below" : "inside";
    };
    TreeView.prototype.clearDropClasses = function () {
        var dropAbove = this.treeRoot.querySelector(".drop-above");
        if (dropAbove != null)
            dropAbove.classList.remove("drop-above");
        var dropInside = this.treeRoot.querySelector(".drop-inside");
        if (dropInside != null)
            dropInside.classList.remove("drop-inside");
        var dropBelow = this.treeRoot.querySelector(".drop-below");
        if (dropBelow != null)
            dropBelow.classList.remove("drop-below");
        // For the rare case where we're dropping a foreign item into an empty tree view
        this.treeRoot.classList.remove("drop-inside");
    };
    return TreeView;
}(events_1.EventEmitter));
module.exports = TreeView;

},{"events":1}]},{},[2])(2)
});
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"events":15}],15:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var objectCreate = Object.create || objectCreatePolyfill
var objectKeys = Object.keys || objectKeysPolyfill
var bind = Function.prototype.bind || functionBindPolyfill

function EventEmitter() {
  if (!this._events || !Object.prototype.hasOwnProperty.call(this, '_events')) {
    this._events = objectCreate(null);
    this._eventsCount = 0;
  }

  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
var defaultMaxListeners = 10;

var hasDefineProperty;
try {
  var o = {};
  if (Object.defineProperty) Object.defineProperty(o, 'x', { value: 0 });
  hasDefineProperty = o.x === 0;
} catch (err) { hasDefineProperty = false }
if (hasDefineProperty) {
  Object.defineProperty(EventEmitter, 'defaultMaxListeners', {
    enumerable: true,
    get: function() {
      return defaultMaxListeners;
    },
    set: function(arg) {
      // check whether the input is a positive number (whose value is zero or
      // greater and not a NaN).
      if (typeof arg !== 'number' || arg < 0 || arg !== arg)
        throw new TypeError('"defaultMaxListeners" must be a positive number');
      defaultMaxListeners = arg;
    }
  });
} else {
  EventEmitter.defaultMaxListeners = defaultMaxListeners;
}

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
  if (typeof n !== 'number' || n < 0 || isNaN(n))
    throw new TypeError('"n" argument must be a positive number');
  this._maxListeners = n;
  return this;
};

function $getMaxListeners(that) {
  if (that._maxListeners === undefined)
    return EventEmitter.defaultMaxListeners;
  return that._maxListeners;
}

EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
  return $getMaxListeners(this);
};

// These standalone emit* functions are used to optimize calling of event
// handlers for fast cases because emit() itself often has a variable number of
// arguments and can be deoptimized because of that. These functions always have
// the same number of arguments and thus do not get deoptimized, so the code
// inside them can execute faster.
function emitNone(handler, isFn, self) {
  if (isFn)
    handler.call(self);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self);
  }
}
function emitOne(handler, isFn, self, arg1) {
  if (isFn)
    handler.call(self, arg1);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1);
  }
}
function emitTwo(handler, isFn, self, arg1, arg2) {
  if (isFn)
    handler.call(self, arg1, arg2);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1, arg2);
  }
}
function emitThree(handler, isFn, self, arg1, arg2, arg3) {
  if (isFn)
    handler.call(self, arg1, arg2, arg3);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1, arg2, arg3);
  }
}

function emitMany(handler, isFn, self, args) {
  if (isFn)
    handler.apply(self, args);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].apply(self, args);
  }
}

EventEmitter.prototype.emit = function emit(type) {
  var er, handler, len, args, i, events;
  var doError = (type === 'error');

  events = this._events;
  if (events)
    doError = (doError && events.error == null);
  else if (!doError)
    return false;

  // If there is no 'error' event listener then throw.
  if (doError) {
    if (arguments.length > 1)
      er = arguments[1];
    if (er instanceof Error) {
      throw er; // Unhandled 'error' event
    } else {
      // At least give some kind of context to the user
      var err = new Error('Unhandled "error" event. (' + er + ')');
      err.context = er;
      throw err;
    }
    return false;
  }

  handler = events[type];

  if (!handler)
    return false;

  var isFn = typeof handler === 'function';
  len = arguments.length;
  switch (len) {
      // fast cases
    case 1:
      emitNone(handler, isFn, this);
      break;
    case 2:
      emitOne(handler, isFn, this, arguments[1]);
      break;
    case 3:
      emitTwo(handler, isFn, this, arguments[1], arguments[2]);
      break;
    case 4:
      emitThree(handler, isFn, this, arguments[1], arguments[2], arguments[3]);
      break;
      // slower
    default:
      args = new Array(len - 1);
      for (i = 1; i < len; i++)
        args[i - 1] = arguments[i];
      emitMany(handler, isFn, this, args);
  }

  return true;
};

function _addListener(target, type, listener, prepend) {
  var m;
  var events;
  var existing;

  if (typeof listener !== 'function')
    throw new TypeError('"listener" argument must be a function');

  events = target._events;
  if (!events) {
    events = target._events = objectCreate(null);
    target._eventsCount = 0;
  } else {
    // To avoid recursion in the case that type === "newListener"! Before
    // adding it to the listeners, first emit "newListener".
    if (events.newListener) {
      target.emit('newListener', type,
          listener.listener ? listener.listener : listener);

      // Re-assign `events` because a newListener handler could have caused the
      // this._events to be assigned to a new object
      events = target._events;
    }
    existing = events[type];
  }

  if (!existing) {
    // Optimize the case of one listener. Don't need the extra array object.
    existing = events[type] = listener;
    ++target._eventsCount;
  } else {
    if (typeof existing === 'function') {
      // Adding the second element, need to change to array.
      existing = events[type] =
          prepend ? [listener, existing] : [existing, listener];
    } else {
      // If we've already got an array, just append.
      if (prepend) {
        existing.unshift(listener);
      } else {
        existing.push(listener);
      }
    }

    // Check for listener leak
    if (!existing.warned) {
      m = $getMaxListeners(target);
      if (m && m > 0 && existing.length > m) {
        existing.warned = true;
        var w = new Error('Possible EventEmitter memory leak detected. ' +
            existing.length + ' "' + String(type) + '" listeners ' +
            'added. Use emitter.setMaxListeners() to ' +
            'increase limit.');
        w.name = 'MaxListenersExceededWarning';
        w.emitter = target;
        w.type = type;
        w.count = existing.length;
        if (typeof console === 'object' && console.warn) {
          console.warn('%s: %s', w.name, w.message);
        }
      }
    }
  }

  return target;
}

EventEmitter.prototype.addListener = function addListener(type, listener) {
  return _addListener(this, type, listener, false);
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.prependListener =
    function prependListener(type, listener) {
      return _addListener(this, type, listener, true);
    };

function onceWrapper() {
  if (!this.fired) {
    this.target.removeListener(this.type, this.wrapFn);
    this.fired = true;
    switch (arguments.length) {
      case 0:
        return this.listener.call(this.target);
      case 1:
        return this.listener.call(this.target, arguments[0]);
      case 2:
        return this.listener.call(this.target, arguments[0], arguments[1]);
      case 3:
        return this.listener.call(this.target, arguments[0], arguments[1],
            arguments[2]);
      default:
        var args = new Array(arguments.length);
        for (var i = 0; i < args.length; ++i)
          args[i] = arguments[i];
        this.listener.apply(this.target, args);
    }
  }
}

function _onceWrap(target, type, listener) {
  var state = { fired: false, wrapFn: undefined, target: target, type: type, listener: listener };
  var wrapped = bind.call(onceWrapper, state);
  wrapped.listener = listener;
  state.wrapFn = wrapped;
  return wrapped;
}

EventEmitter.prototype.once = function once(type, listener) {
  if (typeof listener !== 'function')
    throw new TypeError('"listener" argument must be a function');
  this.on(type, _onceWrap(this, type, listener));
  return this;
};

EventEmitter.prototype.prependOnceListener =
    function prependOnceListener(type, listener) {
      if (typeof listener !== 'function')
        throw new TypeError('"listener" argument must be a function');
      this.prependListener(type, _onceWrap(this, type, listener));
      return this;
    };

// Emits a 'removeListener' event if and only if the listener was removed.
EventEmitter.prototype.removeListener =
    function removeListener(type, listener) {
      var list, events, position, i, originalListener;

      if (typeof listener !== 'function')
        throw new TypeError('"listener" argument must be a function');

      events = this._events;
      if (!events)
        return this;

      list = events[type];
      if (!list)
        return this;

      if (list === listener || list.listener === listener) {
        if (--this._eventsCount === 0)
          this._events = objectCreate(null);
        else {
          delete events[type];
          if (events.removeListener)
            this.emit('removeListener', type, list.listener || listener);
        }
      } else if (typeof list !== 'function') {
        position = -1;

        for (i = list.length - 1; i >= 0; i--) {
          if (list[i] === listener || list[i].listener === listener) {
            originalListener = list[i].listener;
            position = i;
            break;
          }
        }

        if (position < 0)
          return this;

        if (position === 0)
          list.shift();
        else
          spliceOne(list, position);

        if (list.length === 1)
          events[type] = list[0];

        if (events.removeListener)
          this.emit('removeListener', type, originalListener || listener);
      }

      return this;
    };

EventEmitter.prototype.removeAllListeners =
    function removeAllListeners(type) {
      var listeners, events, i;

      events = this._events;
      if (!events)
        return this;

      // not listening for removeListener, no need to emit
      if (!events.removeListener) {
        if (arguments.length === 0) {
          this._events = objectCreate(null);
          this._eventsCount = 0;
        } else if (events[type]) {
          if (--this._eventsCount === 0)
            this._events = objectCreate(null);
          else
            delete events[type];
        }
        return this;
      }

      // emit removeListener for all listeners on all events
      if (arguments.length === 0) {
        var keys = objectKeys(events);
        var key;
        for (i = 0; i < keys.length; ++i) {
          key = keys[i];
          if (key === 'removeListener') continue;
          this.removeAllListeners(key);
        }
        this.removeAllListeners('removeListener');
        this._events = objectCreate(null);
        this._eventsCount = 0;
        return this;
      }

      listeners = events[type];

      if (typeof listeners === 'function') {
        this.removeListener(type, listeners);
      } else if (listeners) {
        // LIFO order
        for (i = listeners.length - 1; i >= 0; i--) {
          this.removeListener(type, listeners[i]);
        }
      }

      return this;
    };

function _listeners(target, type, unwrap) {
  var events = target._events;

  if (!events)
    return [];

  var evlistener = events[type];
  if (!evlistener)
    return [];

  if (typeof evlistener === 'function')
    return unwrap ? [evlistener.listener || evlistener] : [evlistener];

  return unwrap ? unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
}

EventEmitter.prototype.listeners = function listeners(type) {
  return _listeners(this, type, true);
};

EventEmitter.prototype.rawListeners = function rawListeners(type) {
  return _listeners(this, type, false);
};

EventEmitter.listenerCount = function(emitter, type) {
  if (typeof emitter.listenerCount === 'function') {
    return emitter.listenerCount(type);
  } else {
    return listenerCount.call(emitter, type);
  }
};

EventEmitter.prototype.listenerCount = listenerCount;
function listenerCount(type) {
  var events = this._events;

  if (events) {
    var evlistener = events[type];

    if (typeof evlistener === 'function') {
      return 1;
    } else if (evlistener) {
      return evlistener.length;
    }
  }

  return 0;
}

EventEmitter.prototype.eventNames = function eventNames() {
  return this._eventsCount > 0 ? Reflect.ownKeys(this._events) : [];
};

// About 1.5x faster than the two-arg version of Array#splice().
function spliceOne(list, index) {
  for (var i = index, k = i + 1, n = list.length; k < n; i += 1, k += 1)
    list[i] = list[k];
  list.pop();
}

function arrayClone(arr, n) {
  var copy = new Array(n);
  for (var i = 0; i < n; ++i)
    copy[i] = arr[i];
  return copy;
}

function unwrapListeners(arr) {
  var ret = new Array(arr.length);
  for (var i = 0; i < ret.length; ++i) {
    ret[i] = arr[i].listener || arr[i];
  }
  return ret;
}

function objectCreatePolyfill(proto) {
  var F = function() {};
  F.prototype = proto;
  return new F;
}
function objectKeysPolyfill(obj) {
  var keys = [];
  for (var k in obj) if (Object.prototype.hasOwnProperty.call(obj, k)) {
    keys.push(k);
  }
  return k;
}
function functionBindPolyfill(context) {
  var fn = this;
  return function () {
    return fn.apply(context, arguments);
  };
}

},{}],16:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],17:[function(require,module,exports){
(function (global){
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.ResizeHandle = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        // At least give some kind of context to the user
        var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
        err.context = er;
        throw err;
      }
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function(emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],2:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var events = require("events");
var ResizeHandle = (function (_super) {
    __extends(ResizeHandle, _super);
    function ResizeHandle(targetElt, direction, options) {
        var _this = this;
        _super.call(this);
        this.savedSize = null;
        this.onDoubleClick = function (event) {
            if (event.button !== 0 || !_this.handleElt.classList.contains("collapsable"))
                return;
            var size = _this.targetElt.getBoundingClientRect()[_this.horizontal ? "width" : "height"];
            var newSize;
            if (size > 0) {
                _this.savedSize = size;
                newSize = 0;
                _this.targetElt.style.display = "none";
            }
            else {
                newSize = _this.savedSize;
                _this.savedSize = null;
                _this.targetElt.style.display = "";
            }
            if (_this.horizontal)
                _this.targetElt.style.width = newSize + "px";
            else
                _this.targetElt.style.height = newSize + "px";
        };
        this.onMouseDown = function (event) {
            if (event.button !== 0)
                return;
            if (_this.targetElt.style.display === "none")
                return;
            if (_this.handleElt.classList.contains("disabled"))
                return;
            event.preventDefault();
            _this.emit("dragStart");
            var initialSize;
            var startDrag;
            var directionClass;
            if (_this.horizontal) {
                initialSize = _this.targetElt.getBoundingClientRect().width;
                startDrag = event.clientX;
                directionClass = "vertical";
            }
            else {
                initialSize = _this.targetElt.getBoundingClientRect().height;
                startDrag = event.clientY;
                directionClass = "horizontal";
            }
            var dragTarget;
            if (_this.handleElt.setCapture != null) {
                dragTarget = _this.handleElt;
                dragTarget.setCapture();
            }
            else {
                dragTarget = window;
            }
            document.documentElement.classList.add("handle-dragging", directionClass);
            var onMouseMove = function (event) {
                var size = initialSize + (_this.start ? -startDrag : startDrag);
                _this.emit("drag");
                if (_this.horizontal) {
                    size += _this.start ? event.clientX : -event.clientX;
                    _this.targetElt.style.width = size + "px";
                }
                else {
                    size += _this.start ? event.clientY : -event.clientY;
                    _this.targetElt.style.height = size + "px";
                }
            };
            var onMouseUp = function (event) {
                if (dragTarget.releaseCapture != null)
                    dragTarget.releaseCapture();
                document.documentElement.classList.remove("handle-dragging", directionClass);
                dragTarget.removeEventListener("mousemove", onMouseMove);
                dragTarget.removeEventListener("mouseup", onMouseUp);
                _this.emit("dragEnd");
            };
            dragTarget.addEventListener("mousemove", onMouseMove);
            dragTarget.addEventListener("mouseup", onMouseUp);
        };
        if (["left", "right", "top", "bottom"].indexOf(direction) === -1)
            throw new Error("Invalid direction");
        this.horizontal = ["left", "right"].indexOf(direction) !== -1;
        this.start = ["left", "top"].indexOf(direction) !== -1;
        if (options == null)
            options = {};
        this.targetElt = targetElt;
        this.direction = direction;
        var candidateElt = this.start ? targetElt.nextElementSibling : targetElt.previousElementSibling;
        if (candidateElt != null && candidateElt.tagName === "DIV" && candidateElt.classList.contains("resize-handle")) {
            this.handleElt = candidateElt;
        }
        else {
            this.handleElt = document.createElement("div");
            this.handleElt.classList.add("resize-handle");
            if (this.start)
                targetElt.parentNode.insertBefore(this.handleElt, targetElt.nextSibling);
            else
                targetElt.parentNode.insertBefore(this.handleElt, targetElt);
        }
        this.handleElt.classList.add(direction);
        this.handleElt.classList.toggle("collapsable", options.collapsable);
        this.handleElt.addEventListener("dblclick", this.onDoubleClick);
        this.handleElt.addEventListener("mousedown", this.onMouseDown);
    }
    return ResizeHandle;
}(events.EventEmitter));
module.exports = ResizeHandle;

},{"events":1}]},{},[2])(2)
});
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"events":15}],18:[function(require,module,exports){
(function (global){
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.TabStrip = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        // At least give some kind of context to the user
        var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
        err.context = er;
        throw err;
      }
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function(emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],2:[function(require,module,exports){
/// <reference path="../typings/tsd.d.ts" />
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var events_1 = require("events");
var TabStrip = (function (_super) {
    __extends(TabStrip, _super);
    function TabStrip(container) {
        var _this = this;
        _super.call(this);
        this.onTabMouseUp = function (event) {
            var tabElement = event.target;
            // Only handle middle-click and ignore clicks outside any tab
            if (event.button !== 1 || tabElement.parentElement !== _this.tabsRoot)
                return;
            _this.emit("closeTab", tabElement);
        };
        this.onTabMouseDown = function (event) {
            var tabElement = event.target;
            // Only handle left-click
            if (event.button !== 0 || tabElement.parentElement !== _this.tabsRoot)
                return;
            _this.emit("activateTab", tabElement);
            // Tab reordering
            var tabRect = tabElement.getBoundingClientRect();
            var leftOffsetFromMouse = tabRect.left - event.clientX;
            var hasDragged = false;
            var tabPlaceholderElement = document.createElement("li");
            tabPlaceholderElement.style.width = tabRect.width + "px";
            tabPlaceholderElement.className = "drop-placeholder";
            tabPlaceholderElement.classList.toggle("pinned", tabElement.classList.contains("pinned"));
            var updateDraggedTab = function (clientX) {
                var tabsRootRect = _this.tabsRoot.getBoundingClientRect();
                var tabLeft = Math.max(Math.min(clientX + leftOffsetFromMouse, tabsRootRect.right - tabRect.width), tabsRootRect.left);
                if (hasDragged || Math.abs(tabLeft - tabRect.left) >= 10) {
                    if (!hasDragged) {
                        tabElement.classList.add("dragged");
                        tabElement.style.width = tabRect.width + "px";
                        // NOTE: set/releaseCapture aren't supported in Chrome yet
                        // hence the conditional call
                        if (tabElement.setCapture != null)
                            tabElement.setCapture();
                        tabElement.parentElement.insertBefore(tabPlaceholderElement, tabElement.nextSibling);
                        hasDragged = true;
                    }
                }
                else {
                    tabLeft = tabRect.left;
                }
                tabElement.style.left = tabLeft + "px";
                if (tabLeft < tabPlaceholderElement.getBoundingClientRect().left) {
                    var otherTabElement = tabPlaceholderElement;
                    while (true) {
                        otherTabElement = tabPlaceholderElement.previousSibling;
                        if (otherTabElement === tabElement)
                            otherTabElement = otherTabElement.previousSibling;
                        if (otherTabElement == null)
                            break;
                        var otherTabCenter = otherTabElement.getBoundingClientRect().left + otherTabElement.getBoundingClientRect().width / 2;
                        if (otherTabCenter < tabLeft)
                            break;
                        otherTabElement.parentElement.insertBefore(tabPlaceholderElement, otherTabElement);
                    }
                }
                else {
                    var otherTabElement = tabPlaceholderElement;
                    while (true) {
                        otherTabElement = tabPlaceholderElement.nextSibling;
                        if (otherTabElement === tabElement)
                            otherTabElement = otherTabElement.nextSibling;
                        if (otherTabElement == null)
                            break;
                        var otherTabCenter = otherTabElement.getBoundingClientRect().left + otherTabElement.getBoundingClientRect().width / 2;
                        if (tabLeft + tabRect.width <= otherTabCenter)
                            break;
                        otherTabElement.parentElement.insertBefore(tabPlaceholderElement, otherTabElement.nextSibling);
                    }
                }
                if (tabPlaceholderElement.nextSibling === tabElement) {
                    tabElement.parentElement.insertBefore(tabPlaceholderElement, tabElement.nextSibling);
                }
            };
            var onDragTab = function (event) { updateDraggedTab(event.clientX); };
            var onDropTab = function (event) {
                // NOTE: set/releaseCapture aren't supported in Chrome yet
                // hence the conditional call
                if (tabElement.releaseCapture != null)
                    tabElement.releaseCapture();
                if (hasDragged) {
                    if (tabPlaceholderElement.parentElement != null) {
                        _this.tabsRoot.replaceChild(tabElement, tabPlaceholderElement);
                    }
                    else {
                        _this.tabsRoot.appendChild(tabElement);
                    }
                    tabElement.classList.remove("dragged");
                    tabElement.style.left = "";
                    tabElement.style.width = "";
                }
                document.removeEventListener("mousemove", onDragTab);
                document.removeEventListener("mouseup", onDropTab);
            };
            updateDraggedTab(event.clientX);
            document.addEventListener("mousemove", onDragTab);
            document.addEventListener("mouseup", onDropTab);
        };
        this.tabsRoot = container.querySelector(":scope > ol.tab-strip");
        if (this.tabsRoot == null) {
            this.tabsRoot = document.createElement("ol");
            this.tabsRoot.classList.add("tab-strip");
            container.appendChild(this.tabsRoot);
        }
        this.tabsRoot.addEventListener("mousedown", this.onTabMouseDown);
        this.tabsRoot.addEventListener("mouseup", this.onTabMouseUp);
    }
    return TabStrip;
})(events_1.EventEmitter);
module.exports = TabStrip;

},{"events":1}]},{},[2])(2)
});
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"events":15}],19:[function(require,module,exports){
(function (setImmediate,clearImmediate){
var nextTick = require('process/browser.js').nextTick;
var apply = Function.prototype.apply;
var slice = Array.prototype.slice;
var immediateIds = {};
var nextImmediateId = 0;

// DOM APIs, for completeness

exports.setTimeout = function() {
  return new Timeout(apply.call(setTimeout, window, arguments), clearTimeout);
};
exports.setInterval = function() {
  return new Timeout(apply.call(setInterval, window, arguments), clearInterval);
};
exports.clearTimeout =
exports.clearInterval = function(timeout) { timeout.close(); };

function Timeout(id, clearFn) {
  this._id = id;
  this._clearFn = clearFn;
}
Timeout.prototype.unref = Timeout.prototype.ref = function() {};
Timeout.prototype.close = function() {
  this._clearFn.call(window, this._id);
};

// Does not start the time, just sets up the members needed.
exports.enroll = function(item, msecs) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = msecs;
};

exports.unenroll = function(item) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = -1;
};

exports._unrefActive = exports.active = function(item) {
  clearTimeout(item._idleTimeoutId);

  var msecs = item._idleTimeout;
  if (msecs >= 0) {
    item._idleTimeoutId = setTimeout(function onTimeout() {
      if (item._onTimeout)
        item._onTimeout();
    }, msecs);
  }
};

// That's not how node.js implements it but the exposed api is the same.
exports.setImmediate = typeof setImmediate === "function" ? setImmediate : function(fn) {
  var id = nextImmediateId++;
  var args = arguments.length < 2 ? false : slice.call(arguments, 1);

  immediateIds[id] = true;

  nextTick(function onNextTick() {
    if (immediateIds[id]) {
      // fn.call() is faster so we optimize for the common use-case
      // @see http://jsperf.com/call-apply-segu
      if (args) {
        fn.apply(null, args);
      } else {
        fn.call(null);
      }
      // Prevent ids from leaking
      exports.clearImmediate(id);
    }
  });

  return id;
};

exports.clearImmediate = typeof clearImmediate === "function" ? clearImmediate : function(id) {
  delete immediateIds[id];
};
}).call(this,require("timers").setImmediate,require("timers").clearImmediate)
},{"process/browser.js":16,"timers":19}]},{},[1]);
