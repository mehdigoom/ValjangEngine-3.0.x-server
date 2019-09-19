"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function fetch(url, type, callback) {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.responseType = type;
    xhr.onload = (event) => {
        if (xhr.status !== 200 && xhr.status !== 0) {
            callback(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
            return;
        }
        callback(null, xhr.response);
    };
    xhr.onerror = (event) => {
        console.log(event);
        callback(new Error(`Network error: ${event.target.status}`));
    };
    xhr.send();
}
exports.default = fetch;
