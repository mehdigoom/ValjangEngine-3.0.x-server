"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
class TileMap extends events_1.EventEmitter {
    constructor(data) {
        super();
        this.data = data;
    }
    getWidth() { return this.data.width; }
    getHeight() { return this.data.height; }
    getPixelsPerUnit() { return this.data.pixelsPerUnit; }
    getLayersDepthOffset() { return this.data.layerDepthOffset; }
    getLayersCount() { return this.data.layers.length; }
    getLayerId(index) { return this.data.layers[index].id; }
    setTileAt(layer, x, y, value) {
        if (x < 0 || y < 0 || x >= this.data.width || y >= this.data.height)
            return;
        const index = y * this.data.width + x;
        this.data.layers[layer].data[index] = (value != null) ? value : 0;
        this.emit("setTileAt", layer, x, y);
    }
    getTileAt(layer, x, y) {
        if (x < 0 || y < 0 || x >= this.data.width || y >= this.data.height)
            return 0;
        const index = y * this.data.width + x;
        return this.data.layers[layer].data[index];
    }
}
exports.default = TileMap;
