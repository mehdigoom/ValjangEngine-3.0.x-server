"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class TileMapLayers extends SupCore.Data.Base.ListById {
    constructor(pub) {
        super(pub, TileMapLayers.schema);
    }
}
TileMapLayers.schema = {
    name: { type: "string", minLength: 1, maxLength: 80, mutable: true },
    data: { type: "array" }
};
exports.default = TileMapLayers;
