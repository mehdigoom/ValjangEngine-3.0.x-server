"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function getLocalizedFilename(filename, languageCode) {
    if (languageCode === "en")
        return filename;
    const [basename, extension] = filename.split(".");
    return `${basename}.${languageCode}.${extension}`;
}
exports.default = getLocalizedFilename;
