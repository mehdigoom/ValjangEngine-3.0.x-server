"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function readFile(file, type, callback) {
    const reader = new FileReader;
    reader.onload = (event) => {
        let data;
        if (type === "json") {
            try {
                data = JSON.parse(event.target.result);
            }
            catch (err) {
                callback(err, null);
                return;
            }
        }
        else {
            data = event.target.result;
        }
        callback(null, data);
    };
    switch (type) {
        case "text":
        case "json":
            reader.readAsText(file);
            break;
        case "arraybuffer":
            reader.readAsArrayBuffer(file);
            break;
        default:
            callback(new Error(`Unsupported readFile type: ${type}`));
    }
}
exports.default = readFile;
