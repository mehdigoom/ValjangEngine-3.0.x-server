"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
class Input extends events_1.EventEmitter {
    constructor(canvas, options = {}) {
        super();
        this.mouseButtons = [];
        this.mouseButtonsDown = [];
        this.mousePosition = { x: 0, y: 0 };
        this.mouseDelta = { x: 0, y: 0 };
        this.newMouseDelta = { x: 0, y: 0 };
        this.touches = [];
        this.touchesDown = [];
        this.keyboardButtons = [];
        this.keyboardButtonsDown = [];
        this.autoRepeatedKey = null;
        this.textEntered = "";
        this.newTextEntered = "";
        this.gamepadsButtons = [];
        this.gamepadsAxes = [];
        this.gamepadsAutoRepeats = [];
        this.gamepadAxisDeadZone = 0.25;
        this.gamepadAxisAutoRepeatDelayMs = 500;
        this.gamepadAxisAutoRepeatRateMs = 33;
        this.exited = false;
        this.wantsPointerLock = false;
        this.wantsFullscreen = false;
        this.wasPointerLocked = false;
        this.wasFullscreen = false;
        this.onPointerLockChange = () => {
            const isPointerLocked = this._isPointerLocked();
            if (this.wasPointerLocked !== isPointerLocked) {
                this.emit("mouseLockStateChange", isPointerLocked ? "active" : "suspended");
                this.wasPointerLocked = isPointerLocked;
            }
        };
        this.onPointerLockError = () => {
            if (this.wasPointerLocked) {
                this.emit("mouseLockStateChange", "suspended");
                this.wasPointerLocked = false;
            }
        };
        this.onFullscreenChange = () => {
            const isFullscreen = this._isFullscreen();
            if (this.wasFullscreen !== isFullscreen) {
                this.emit("fullscreenStateChange", isFullscreen ? "active" : "suspended");
                this.wasFullscreen = isFullscreen;
            }
        };
        this.onFullscreenError = () => {
            if (this.wasFullscreen) {
                this.emit("fullscreenStateChange", "suspended");
                this.wasFullscreen = false;
            }
        };
        this.onBlur = () => { this.reset(); };
        this.onMouseMove = (event) => {
            event.preventDefault();
            if (this.wantsPointerLock) {
                if (this.wasPointerLocked) {
                    const delta = { x: 0, y: 0 };
                    if (event.movementX != null) {
                        delta.x = event.movementX;
                        delta.y = event.movementY;
                    }
                    else if (event.webkitMovementX != null) {
                        delta.x = event.webkitMovementX;
                        delta.y = event.webkitMovementY;
                    }
                    else if (event.mozMovementX == null) {
                        delta.x = event.mozMovementX;
                        delta.y = event.mozMovementY;
                    }
                    this.newMouseDelta.x += delta.x;
                    this.newMouseDelta.y += delta.y;
                }
            }
            else {
                const rect = event.target.getBoundingClientRect();
                this.newMousePosition = { x: event.clientX - rect.left, y: event.clientY - rect.top };
            }
        };
        this.onMouseDown = (event) => {
            event.preventDefault();
            this.canvas.focus();
            this.mouseButtonsDown[event.button] = true;
            if (this.wantsFullscreen && !this.wasFullscreen)
                this._doGoFullscreen();
            if (this.wantsPointerLock && !this.wasPointerLocked)
                this._doPointerLock();
        };
        this.onMouseUp = (event) => {
            if (this.mouseButtonsDown[event.button])
                event.preventDefault();
            this.mouseButtonsDown[event.button] = false;
            if (this.wantsFullscreen && !this.wasFullscreen)
                this._doGoFullscreen();
            if (this.wantsPointerLock && !this.wasPointerLocked)
                this._doPointerLock();
        };
        this.onMouseDblClick = (event) => {
            event.preventDefault();
            this.mouseButtons[event.button].doubleClicked = true;
        };
        this.onContextMenu = (event) => {
            event.preventDefault();
        };
        this.onMouseWheel = (event) => {
            event.preventDefault();
            this.newScrollDelta = (event.wheelDelta > 0 || event.detail < 0) ? 1 : -1;
            return false;
        };
        this.onTouchStart = (event) => {
            event.preventDefault();
            const rect = event.target.getBoundingClientRect();
            for (let i = 0; i < event.changedTouches.length; i++) {
                const touch = event.changedTouches[i];
                this.touches[touch.identifier].position.x = touch.clientX - rect.left;
                this.touches[touch.identifier].position.y = touch.clientY - rect.top;
                this.touchesDown[touch.identifier] = true;
                if (touch.identifier === 0) {
                    this.newMousePosition = { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
                    this.mouseButtonsDown[0] = true;
                }
            }
        };
        this.onTouchEnd = (event) => {
            event.preventDefault();
            for (let i = 0; i < event.changedTouches.length; i++) {
                const touch = event.changedTouches[i];
                this.touchesDown[touch.identifier] = false;
                if (touch.identifier === 0)
                    this.mouseButtonsDown[0] = false;
            }
        };
        this.onTouchMove = (event) => {
            event.preventDefault();
            const rect = event.target.getBoundingClientRect();
            for (let i = 0; i < event.changedTouches.length; i++) {
                const touch = event.changedTouches[i];
                this.touches[touch.identifier].position.x = touch.clientX - rect.left;
                this.touches[touch.identifier].position.y = touch.clientY - rect.top;
                if (touch.identifier === 0)
                    this.newMousePosition = { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
            }
        };
        // TODO: stop using keyCode when KeyboardEvent.code is supported more widely
        // See https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent.code
        this.onKeyDown = (event) => {
            // NOTE: Key codes in range 33-47 are Page Up/Down, Home/End, arrow keys, Insert/Delete, etc.
            let isControlKey = event.keyCode < 48 && event.keyCode !== 32;
            if (isControlKey)
                event.preventDefault();
            if (!this.keyboardButtonsDown[event.keyCode])
                this.keyboardButtonsDown[event.keyCode] = true;
            else
                this.autoRepeatedKey = event.keyCode;
            return !isControlKey;
        };
        this.onKeyPress = (event) => {
            if (event.keyCode > 0 && event.keyCode < 32)
                return;
            if (event.char != null)
                this.newTextEntered += event.char;
            else if (event.charCode !== 0)
                this.newTextEntered += String.fromCharCode(event.charCode);
            else
                this.newTextEntered += String.fromCharCode(event.keyCode);
        };
        this.onKeyUp = (event) => {
            this.keyboardButtonsDown[event.keyCode] = false;
        };
        this.doExitCallback = () => {
            // NOTE: It seems window.onbeforeunload might be called twice
            // in some circumstances so we check if the callback was cleared already
            // http://stackoverflow.com/questions/8711393/onbeforeunload-fires-twice
            if (!this.exited)
                this.emit("exit");
            this.exited = true;
        };
        if (options == null)
            options = {};
        this.canvas = canvas;
        // Mouse
        this.canvas.addEventListener("mousemove", this.onMouseMove);
        this.canvas.addEventListener("mousedown", this.onMouseDown);
        this.canvas.addEventListener("dblclick", this.onMouseDblClick);
        document.addEventListener("mouseup", this.onMouseUp);
        this.canvas.addEventListener("contextmenu", this.onContextMenu);
        this.canvas.addEventListener("DOMMouseScroll", this.onMouseWheel);
        this.canvas.addEventListener("mousewheel", this.onMouseWheel);
        const compatDoc = document;
        if ("onpointerlockchange" in compatDoc)
            compatDoc.addEventListener("pointerlockchange", this.onPointerLockChange, false);
        else if ("onmozpointerlockchange" in compatDoc)
            compatDoc.addEventListener("mozpointerlockchange", this.onPointerLockChange, false);
        else if ("onwebkitpointerlockchange" in compatDoc)
            compatDoc.addEventListener("webkitpointerlockchange", this.onPointerLockChange, false);
        if ("onpointerlockerror" in compatDoc)
            compatDoc.addEventListener("pointerlockerror", this.onPointerLockError, false);
        else if ("onmozpointerlockerror" in compatDoc)
            compatDoc.addEventListener("mozpointerlockerror", this.onPointerLockError, false);
        else if ("onwebkitpointerlockerror" in compatDoc)
            compatDoc.addEventListener("webkitpointerlockerror", this.onPointerLockError, false);
        if ("onfullscreenchange" in compatDoc)
            compatDoc.addEventListener("fullscreenchange", this.onFullscreenChange, false);
        else if ("onmozfullscreenchange" in compatDoc)
            compatDoc.addEventListener("mozfullscreenchange", this.onFullscreenChange, false);
        else if ("onwebkitfullscreenchange" in compatDoc)
            compatDoc.addEventListener("webkitfullscreenchange", this.onFullscreenChange, false);
        if ("onfullscreenerror" in compatDoc)
            compatDoc.addEventListener("fullscreenerror", this.onFullscreenError, false);
        else if ("onmozfullscreenerror" in compatDoc)
            compatDoc.addEventListener("mozfullscreenerror", this.onFullscreenError, false);
        else if ("onwebkitfullscreenerror" in compatDoc)
            compatDoc.addEventListener("webkitfullscreenerror", this.onFullscreenError, false);
        // Touch
        this.canvas.addEventListener("touchstart", this.onTouchStart);
        this.canvas.addEventListener("touchend", this.onTouchEnd);
        this.canvas.addEventListener("touchmove", this.onTouchMove);
        // Keyboard
        this.canvas.addEventListener("keydown", this.onKeyDown);
        this.canvas.addEventListener("keypress", this.onKeyPress);
        document.addEventListener("keyup", this.onKeyUp);
        // Gamepad
        for (let i = 0; i < 4; i++) {
            this.gamepadsButtons[i] = [];
            this.gamepadsAxes[i] = [];
            this.gamepadsAutoRepeats[i] = null;
        }
        // On exit
        if (options.enableOnExit) {
            window.onbeforeunload = this.doExitCallback;
        }
        window.addEventListener("blur", this.onBlur);
        this.reset();
    }
    destroy() {
        this.removeAllListeners();
        this.canvas.removeEventListener("mousemove", this.onMouseMove);
        this.canvas.removeEventListener("mousedown", this.onMouseDown);
        document.removeEventListener("mouseup", this.onMouseUp);
        this.canvas.removeEventListener("contextmenu", this.onContextMenu);
        this.canvas.removeEventListener("DOMMouseScroll", this.onMouseWheel);
        this.canvas.removeEventListener("mousewheel", this.onMouseWheel);
        const compatDoc = document;
        if ("onpointerlockchange" in compatDoc)
            compatDoc.removeEventListener("pointerlockchange", this.onPointerLockChange, false);
        else if ("onmozpointerlockchange" in compatDoc)
            compatDoc.removeEventListener("mozpointerlockchange", this.onPointerLockChange, false);
        else if ("onwebkitpointerlockchange" in compatDoc)
            compatDoc.removeEventListener("webkitpointerlockchange", this.onPointerLockChange, false);
        if ("onpointerlockerror" in compatDoc)
            compatDoc.removeEventListener("pointerlockerror", this.onPointerLockError, false);
        else if ("onmozpointerlockerror" in compatDoc)
            compatDoc.removeEventListener("mozpointerlockerror", this.onPointerLockError, false);
        else if ("onwebkitpointerlockerror" in compatDoc)
            compatDoc.removeEventListener("webkitpointerlockerror", this.onPointerLockError, false);
        if ("onfullscreenchange" in compatDoc)
            compatDoc.removeEventListener("fullscreenchange", this.onFullscreenChange, false);
        else if ("onmozfullscreenchange" in compatDoc)
            compatDoc.removeEventListener("mozfullscreenchange", this.onFullscreenChange, false);
        else if ("onwebkitfullscreenchange" in compatDoc)
            compatDoc.removeEventListener("webkitfullscreenchange", this.onFullscreenChange, false);
        if ("onfullscreenerror" in compatDoc)
            compatDoc.removeEventListener("fullscreenerror", this.onFullscreenError, false);
        else if ("onmozfullscreenerror" in compatDoc)
            compatDoc.removeEventListener("mozfullscreenerror", this.onFullscreenError, false);
        else if ("onwebkitfullscreenerror" in compatDoc)
            compatDoc.removeEventListener("webkitfullscreenerror", this.onFullscreenError, false);
        this.canvas.removeEventListener("touchstart", this.onTouchStart);
        this.canvas.removeEventListener("touchend", this.onTouchEnd);
        this.canvas.removeEventListener("touchmove", this.onTouchMove);
        this.canvas.removeEventListener("keydown", this.onKeyDown);
        this.canvas.removeEventListener("keypress", this.onKeyPress);
        document.removeEventListener("keyup", this.onKeyUp);
        window.removeEventListener("blur", this.onBlur);
    }
    reset() {
        // Mouse
        this.newScrollDelta = 0;
        for (let i = 0; i <= 6; i++) {
            this.mouseButtons[i] = { isDown: false, doubleClicked: false, wasJustPressed: false, wasJustReleased: false };
            this.mouseButtonsDown[i] = false;
        }
        this.mousePosition.x = 0;
        this.mousePosition.y = 0;
        this.newMousePosition = null;
        this.mouseDelta.x = 0;
        this.mouseDelta.y = 0;
        this.newMouseDelta.x = 0;
        this.newMouseDelta.y = 0;
        // Touch
        for (let i = 0; i < Input.maxTouches; i++) {
            this.touches[i] = { isDown: false, wasStarted: false, wasEnded: false, position: { x: 0, y: 0 } };
            this.touchesDown[i] = false;
        }
        // Keyboard
        for (let i = 0; i <= 255; i++) {
            this.keyboardButtons[i] = { isDown: false, wasJustPressed: false, wasJustAutoRepeated: false, wasJustReleased: false };
            this.keyboardButtonsDown[i] = false;
        }
        this.textEntered = "";
        this.newTextEntered = "";
        // Gamepads
        for (let i = 0; i < 4; i++) {
            for (let button = 0; button < 16; button++) {
                this.gamepadsButtons[i][button] = {
                    isDown: false,
                    wasJustPressed: false,
                    wasJustReleased: false,
                    value: 0
                };
            }
            for (let axes = 0; axes < 4; axes++) {
                this.gamepadsAxes[i][axes] = {
                    wasPositiveJustPressed: false,
                    wasPositiveJustAutoRepeated: false,
                    wasPositiveJustReleased: false,
                    wasNegativeJustPressed: false,
                    wasNegativeJustAutoRepeated: false,
                    wasNegativeJustReleased: false,
                    value: 0
                };
            }
        }
    }
    lockMouse() {
        this.wantsPointerLock = true;
        this.newMouseDelta.x = 0;
        this.newMouseDelta.y = 0;
    }
    unlockMouse() {
        this.wantsPointerLock = false;
        this.wasPointerLocked = false;
        if (!this._isPointerLocked())
            return;
        if (document.exitPointerLock)
            document.exitPointerLock();
        else if (document.webkitExitPointerLock)
            document.webkitExitPointerLock();
        else if (document.mozExitPointerLock)
            document.mozExitPointerLock();
    }
    _isPointerLocked() {
        return document.pointerLockElement === this.canvas ||
            document.webkitPointerLockElement === this.canvas ||
            document.mozPointerLockElement === this.canvas;
    }
    _doPointerLock() {
        if (this.canvas.requestPointerLock)
            this.canvas.requestPointerLock();
        else if (this.canvas.webkitRequestPointerLock)
            this.canvas.webkitRequestPointerLock();
        else if (this.canvas.mozRequestPointerLock)
            this.canvas.mozRequestPointerLock();
    }
    goFullscreen() { this.wantsFullscreen = true; }
    exitFullscreen() {
        this.wantsFullscreen = false;
        this.wasFullscreen = false;
        if (!this._isFullscreen())
            return;
        if (document.exitFullscreen)
            document.exitFullscreen();
        else if (document.webkitExitFullscreen)
            document.webkitExitFullscreen();
        else if (document.mozCancelFullScreen)
            document.mozCancelFullScreen();
    }
    _isFullscreen() {
        return document.fullscreenElement === this.canvas ||
            document.webkitFullscreenElement === this.canvas ||
            document.mozFullScreenElement === this.canvas;
    }
    _doGoFullscreen() {
        if (this.canvas.requestFullscreen)
            this.canvas.requestFullscreen();
        else if (this.canvas.webkitRequestFullscreen)
            this.canvas.webkitRequestFullscreen();
        else if (this.canvas.mozRequestFullScreen)
            this.canvas.mozRequestFullScreen();
    }
    update() {
        this.mouseButtonsDown[5] = this.newScrollDelta > 0;
        this.mouseButtonsDown[6] = this.newScrollDelta < 0;
        if (this.newScrollDelta !== 0)
            this.newScrollDelta = 0;
        if (this.wantsPointerLock) {
            this.mouseDelta.x = this.newMouseDelta.x;
            this.mouseDelta.y = this.newMouseDelta.y;
            this.newMouseDelta.x = 0;
            this.newMouseDelta.y = 0;
        }
        else if (this.newMousePosition != null) {
            this.mouseDelta.x = this.newMousePosition.x - this.mousePosition.x;
            this.mouseDelta.y = this.newMousePosition.y - this.mousePosition.y;
            this.mousePosition.x = this.newMousePosition.x;
            this.mousePosition.y = this.newMousePosition.y;
            this.newMousePosition = null;
        }
        else {
            this.mouseDelta.x = 0;
            this.mouseDelta.y = 0;
        }
        for (let i = 0; i < this.mouseButtons.length; i++) {
            const mouseButton = this.mouseButtons[i];
            const wasDown = mouseButton.isDown;
            mouseButton.isDown = this.mouseButtonsDown[i];
            mouseButton.wasJustPressed = !wasDown && mouseButton.isDown;
            mouseButton.wasJustReleased = wasDown && !mouseButton.isDown;
        }
        for (let i = 0; i < this.touches.length; i++) {
            const touch = this.touches[i];
            const wasDown = touch.isDown;
            touch.isDown = this.touchesDown[i];
            touch.wasStarted = !wasDown && touch.isDown;
            touch.wasEnded = wasDown && !touch.isDown;
        }
        for (let i = 0; i < this.keyboardButtons.length; i++) {
            const keyboardButton = this.keyboardButtons[i];
            const wasDown = keyboardButton.isDown;
            keyboardButton.isDown = this.keyboardButtonsDown[i];
            keyboardButton.wasJustPressed = !wasDown && keyboardButton.isDown;
            keyboardButton.wasJustAutoRepeated = false;
            keyboardButton.wasJustReleased = wasDown && !keyboardButton.isDown;
        }
        if (this.autoRepeatedKey != null) {
            this.keyboardButtons[this.autoRepeatedKey].wasJustAutoRepeated = true;
            this.autoRepeatedKey = null;
        }
        this.textEntered = this.newTextEntered;
        this.newTextEntered = "";
        const gamepads = (navigator.getGamepads != null) ? navigator.getGamepads() : null;
        if (gamepads == null)
            return;
        for (let index = 0; index < 4; index++) {
            const gamepad = gamepads[index];
            if (gamepad == null)
                continue;
            for (let i = 0; i < this.gamepadsButtons[index].length; i++) {
                if (gamepad.buttons[i] == null)
                    continue;
                const button = this.gamepadsButtons[index][i];
                const wasDown = button.isDown;
                button.isDown = gamepad.buttons[i].pressed;
                button.value = gamepad.buttons[i].value;
                button.wasJustPressed = !wasDown && button.isDown;
                button.wasJustReleased = wasDown && !button.isDown;
            }
            const pressedValue = 0.5;
            const now = Date.now();
            for (let stick = 0; stick < 2; stick++) {
                if (gamepad.axes[2 * stick] == null || gamepad.axes[2 * stick + 1] == null)
                    continue;
                const axisLength = Math.sqrt(Math.pow(Math.abs(gamepad.axes[2 * stick]), 2) + Math.pow(Math.abs(gamepad.axes[2 * stick + 1]), 2));
                const axes = [this.gamepadsAxes[index][2 * stick], this.gamepadsAxes[index][2 * stick + 1]];
                const wasAxisDown = [
                    { positive: axes[0].value > pressedValue, negative: axes[0].value < -pressedValue },
                    { positive: axes[1].value > pressedValue, negative: axes[1].value < -pressedValue }
                ];
                if (axisLength < this.gamepadAxisDeadZone) {
                    axes[0].value = 0;
                    axes[1].value = 0;
                }
                else {
                    axes[0].value = gamepad.axes[2 * stick];
                    axes[1].value = gamepad.axes[2 * stick + 1];
                }
                const isAxisDown = [
                    { positive: axes[0].value > pressedValue, negative: axes[0].value < -pressedValue },
                    { positive: axes[1].value > pressedValue, negative: axes[1].value < -pressedValue }
                ];
                axes[0].wasPositiveJustPressed = !wasAxisDown[0].positive && isAxisDown[0].positive;
                axes[0].wasPositiveJustReleased = wasAxisDown[0].positive && !isAxisDown[0].positive;
                axes[0].wasPositiveJustAutoRepeated = false;
                axes[0].wasNegativeJustPressed = !wasAxisDown[0].negative && isAxisDown[0].negative;
                axes[0].wasNegativeJustReleased = wasAxisDown[0].negative && !isAxisDown[0].negative;
                axes[0].wasNegativeJustAutoRepeated = false;
                axes[1].wasPositiveJustPressed = !wasAxisDown[1].positive && isAxisDown[1].positive;
                axes[1].wasPositiveJustReleased = wasAxisDown[1].positive && !isAxisDown[1].positive;
                axes[1].wasPositiveJustAutoRepeated = false;
                axes[1].wasNegativeJustPressed = !wasAxisDown[1].negative && isAxisDown[1].negative;
                axes[1].wasNegativeJustReleased = wasAxisDown[1].negative && !isAxisDown[1].negative;
                axes[1].wasNegativeJustAutoRepeated = false;
                let currentAutoRepeat = this.gamepadsAutoRepeats[index];
                if (currentAutoRepeat != null) {
                    const axisIndex = currentAutoRepeat.axis - stick * 2;
                    if (axisIndex === 0 || axisIndex === 1) {
                        const autoRepeatedAxis = axes[axisIndex];
                        if ((currentAutoRepeat.positive && !isAxisDown[axisIndex].positive) ||
                            (!currentAutoRepeat.positive && !isAxisDown[axisIndex].negative)) {
                            // Auto-repeated axis has been released
                            currentAutoRepeat = this.gamepadsAutoRepeats[index] = null;
                        }
                        else {
                            // Check for auto-repeat deadline
                            if (currentAutoRepeat.time <= now) {
                                if (currentAutoRepeat.positive)
                                    autoRepeatedAxis.wasPositiveJustAutoRepeated = true;
                                else
                                    autoRepeatedAxis.wasNegativeJustAutoRepeated = true;
                                currentAutoRepeat.time = now + this.gamepadAxisAutoRepeatRateMs;
                            }
                        }
                    }
                }
                let newAutoRepeat;
                if (axes[0].wasPositiveJustPressed || axes[0].wasNegativeJustPressed) {
                    newAutoRepeat = { axis: stick * 2, positive: axes[0].wasPositiveJustPressed, time: now + this.gamepadAxisAutoRepeatDelayMs };
                }
                else if (axes[1].wasPositiveJustPressed || axes[1].wasNegativeJustPressed) {
                    newAutoRepeat = { axis: stick * 2 + 1, positive: axes[1].wasPositiveJustPressed, time: now + this.gamepadAxisAutoRepeatDelayMs };
                }
                if (newAutoRepeat != null) {
                    if (currentAutoRepeat == null || currentAutoRepeat.axis !== newAutoRepeat.axis || currentAutoRepeat.positive !== newAutoRepeat.positive) {
                        this.gamepadsAutoRepeats[index] = newAutoRepeat;
                    }
                }
            }
        }
    }
}
Input.maxTouches = 10;
exports.default = Input;
// FIXME: KeyEvent isn't in lib.d.ts yet
if (global.window != null && window.KeyEvent == null) {
    window.KeyEvent = {
        DOM_VK_CANCEL: 3,
        DOM_VK_HELP: 6,
        DOM_VK_BACK_SPACE: 8,
        DOM_VK_TAB: 9,
        DOM_VK_CLEAR: 12,
        DOM_VK_RETURN: 13,
        DOM_VK_ENTER: 14,
        DOM_VK_SHIFT: 16,
        DOM_VK_CONTROL: 17,
        DOM_VK_ALT: 18,
        DOM_VK_PAUSE: 19,
        DOM_VK_CAPS_LOCK: 20,
        DOM_VK_ESCAPE: 27,
        DOM_VK_SPACE: 32,
        DOM_VK_PAGE_UP: 33,
        DOM_VK_PAGE_DOWN: 34,
        DOM_VK_END: 35,
        DOM_VK_HOME: 36,
        DOM_VK_LEFT: 37,
        DOM_VK_UP: 38,
        DOM_VK_RIGHT: 39,
        DOM_VK_DOWN: 40,
        DOM_VK_PRINTSCREEN: 44,
        DOM_VK_INSERT: 45,
        DOM_VK_DELETE: 46,
        DOM_VK_0: 48,
        DOM_VK_1: 49,
        DOM_VK_2: 50,
        DOM_VK_3: 51,
        DOM_VK_4: 52,
        DOM_VK_5: 53,
        DOM_VK_6: 54,
        DOM_VK_7: 55,
        DOM_VK_8: 56,
        DOM_VK_9: 57,
        DOM_VK_SEMICOLON: 59,
        DOM_VK_EQUALS: 61,
        DOM_VK_A: 65,
        DOM_VK_B: 66,
        DOM_VK_C: 67,
        DOM_VK_D: 68,
        DOM_VK_E: 69,
        DOM_VK_F: 70,
        DOM_VK_G: 71,
        DOM_VK_H: 72,
        DOM_VK_I: 73,
        DOM_VK_J: 74,
        DOM_VK_K: 75,
        DOM_VK_L: 76,
        DOM_VK_M: 77,
        DOM_VK_N: 78,
        DOM_VK_O: 79,
        DOM_VK_P: 80,
        DOM_VK_Q: 81,
        DOM_VK_R: 82,
        DOM_VK_S: 83,
        DOM_VK_T: 84,
        DOM_VK_U: 85,
        DOM_VK_V: 86,
        DOM_VK_W: 87,
        DOM_VK_X: 88,
        DOM_VK_Y: 89,
        DOM_VK_Z: 90,
        DOM_VK_CONTEXT_MENU: 93,
        DOM_VK_NUMPAD0: 96,
        DOM_VK_NUMPAD1: 97,
        DOM_VK_NUMPAD2: 98,
        DOM_VK_NUMPAD3: 99,
        DOM_VK_NUMPAD4: 100,
        DOM_VK_NUMPAD5: 101,
        DOM_VK_NUMPAD6: 102,
        DOM_VK_NUMPAD7: 103,
        DOM_VK_NUMPAD8: 104,
        DOM_VK_NUMPAD9: 105,
        DOM_VK_MULTIPLY: 106,
        DOM_VK_ADD: 107,
        DOM_VK_SEPARATOR: 108,
        DOM_VK_SUBTRACT: 109,
        DOM_VK_DECIMAL: 110,
        DOM_VK_DIVIDE: 111,
        DOM_VK_F1: 112,
        DOM_VK_F2: 113,
        DOM_VK_F3: 114,
        DOM_VK_F4: 115,
        DOM_VK_F5: 116,
        DOM_VK_F6: 117,
        DOM_VK_F7: 118,
        DOM_VK_F8: 119,
        DOM_VK_F9: 120,
        DOM_VK_F10: 121,
        DOM_VK_F11: 122,
        DOM_VK_F12: 123,
        DOM_VK_F13: 124,
        DOM_VK_F14: 125,
        DOM_VK_F15: 126,
        DOM_VK_F16: 127,
        DOM_VK_F17: 128,
        DOM_VK_F18: 129,
        DOM_VK_F19: 130,
        DOM_VK_F20: 131,
        DOM_VK_F21: 132,
        DOM_VK_F22: 133,
        DOM_VK_F23: 134,
        DOM_VK_F24: 135,
        DOM_VK_NUM_LOCK: 144,
        DOM_VK_SCROLL_LOCK: 145,
        DOM_VK_COMMA: 188,
        DOM_VK_PERIOD: 190,
        DOM_VK_SLASH: 191,
        DOM_VK_BACK_QUOTE: 192,
        DOM_VK_OPEN_BRACKET: 219,
        DOM_VK_BACK_SLASH: 220,
        DOM_VK_CLOSE_BRACKET: 221,
        DOM_VK_QUOTE: 222,
        DOM_VK_META: 224
    };
}
