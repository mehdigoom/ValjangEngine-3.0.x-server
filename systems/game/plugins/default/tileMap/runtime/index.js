"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TileMapRenderer = require("./TileMapRenderer");
const tileMap = require("./tileMap");
const tileSet = require("./tileSet");
SupRuntime.registerPlugin("TileMapRenderer", TileMapRenderer);
SupRuntime.registerPlugin("tileMap", tileMap);
SupRuntime.registerPlugin("tileSet", tileSet);
