"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dialogs = require("simple-dialogs");
// Help callback
let helpCallback = null;
function setupHelpCallback(callback) {
    helpCallback = callback;
}
exports.setupHelpCallback = setupHelpCallback;
// Development mode
if (localStorage.getItem("ValjangEngine-dev-mode") != null && window.top != null)
    window.onerror = onError;
function onError() {
    window.top.postMessage({ type: "error" }, window.location.origin);
}
// Auto-select number fields when focusing them
document.body.addEventListener("focus", onFocus, true);
function onFocus(event) {
    const target = event.target;
    if (target.tagName !== "INPUT" || target.type !== "number")
        return;
    target.select();
}
// Hotkey handling
function setupHotkeys() {
    console.warn("SupClient.setupHotkeys() has been removed, it is no longer necessary to call it.");
}
exports.setupHotkeys = setupHotkeys;
function sendHotkey(content) {
    window.top.postMessage({ type: "hotkey", content }, window.location.origin);
}
document.addEventListener("keydown", onKeyDown);
document.addEventListener("keyup", onKeyUp);
window.addEventListener("beforeunload", onBeforeUnload);
let isBackspaceDown = false;
function onKeyDown(event) {
    // F12
    if (event.keyCode === 123) {
        sendHotkey("devtools");
        return;
    }
    // Backspace
    if (event.keyCode === 8)
        isBackspaceDown = true;
    if (dialogs.BaseDialog.activeDialog != null)
        return;
    const ctrlOrCmd = event.ctrlKey || event.metaKey;
    // Ctrl+N
    if (event.keyCode === 78 && ctrlOrCmd) {
        event.preventDefault();
        if (event.shiftKey)
            sendHotkey("newFolder");
        else
            sendHotkey("newAsset");
        return;
    }
    // Ctrl+O or Ctrl+P
    if ((event.keyCode === 79 || event.keyCode === 80) && ctrlOrCmd) {
        event.preventDefault();
        sendHotkey("searchEntry");
        return;
    }
    // Ctrl+W
    if (event.keyCode === 87 && ctrlOrCmd) {
        event.preventDefault();
        sendHotkey("closeTab");
        return;
    }
    // Ctrl+Tab or Ctrl+Shift+Tab
    if (event.keyCode === 9 && event.ctrlKey) {
        event.preventDefault();
        if (event.shiftKey)
            sendHotkey("previousTab");
        else
            sendHotkey("nextTab");
        return;
    }
    // F1
    if (event.keyCode === 112) {
        event.preventDefault();
        if (helpCallback != null)
            helpCallback();
        return;
    }
    // F5 or Cmd+P
    if (event.keyCode === 116 || (event.keyCode === 80 && event.metaKey)) {
        event.preventDefault();
        sendHotkey("run");
        return;
    }
    // F6 or Cmd+Shift-P
    if (event.keyCode === 117 || (event.keyCode === 80 && event.metaKey && event.shiftKey)) {
        event.preventDefault();
        sendHotkey("debug");
        return;
    }
    // Forward message to active tab (iframe) when event comes from the main window and is not handled
    if (window.top === window) {
        window.postMessage({
            type: "forwardKeyboardEventToActiveTab", eventType: "keydown", keyCode: event.keyCode,
            ctrlKey: event.ctrlKey, altKey: event.altKey, shiftKey: event.shiftKey, metaKey: event.metaKey
        }, window.location.origin);
    }
}
function onKeyUp(event) {
    if (event.keyCode === 8 /* Backspace */)
        isBackspaceDown = false;
    // Forward message to active tab (iframe) when event comes from the main window and is not handled
    if (window.top === window) {
        window.postMessage({
            type: "forwardKeyboardEventToActiveTab", eventType: "keyup", keyCode: event.keyCode,
            ctrlKey: event.ctrlKey, altKey: event.altKey, shiftKey: event.shiftKey, metaKey: event.metaKey
        }, window.location.origin);
    }
}
function onBeforeUnload(event) {
    if (isBackspaceDown) {
        isBackspaceDown = false;
        event.returnValue = "You pressed backspace.";
        return "You pressed backspace.";
    }
    return null;
}
