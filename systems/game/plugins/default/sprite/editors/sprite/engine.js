"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const spritesheetArea_1 = require("./spritesheetArea");
const animationArea_1 = require("./animationArea");
let isTabActive = true;
let animationFrame;
window.addEventListener("message", (event) => {
    if (event.data.type === "deactivate" || event.data.type === "activate") {
        isTabActive = event.data.type === "activate";
        onChangeActive();
    }
});
function onChangeActive() {
    const stopRendering = !isTabActive;
    if (stopRendering) {
        if (animationFrame != null) {
            cancelAnimationFrame(animationFrame);
            animationFrame = null;
        }
    }
    else if (animationFrame == null) {
        animationFrame = requestAnimationFrame(tick);
    }
}
let lastTimestamp = 0;
let accumulatedTime = 0;
function tick(timestamp = 0) {
    accumulatedTime += timestamp - lastTimestamp;
    lastTimestamp = timestamp;
    const { updates, timeLeft } = spritesheetArea_1.default.gameInstance.tick(accumulatedTime);
    accumulatedTime = timeLeft;
    if (updates > 0) {
        for (let i = 0; i < updates; i++) {
            animationArea_1.default.gameInstance.update();
            animationArea_1.handleAnimationArea();
        }
        spritesheetArea_1.default.gameInstance.draw();
        animationArea_1.default.gameInstance.draw();
    }
    animationFrame = requestAnimationFrame(tick);
}
animationFrame = requestAnimationFrame(tick);
