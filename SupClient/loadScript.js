"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function loadScript(url, callback) {
    const script = document.createElement("script");
    script.src = url;
    script.addEventListener("load", () => { callback(); });
    script.addEventListener("error", () => { callback(); });
    document.body.appendChild(script);
}
exports.default = loadScript;
