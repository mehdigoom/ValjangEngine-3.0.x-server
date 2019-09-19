(function() {
    function r(e, n, t) {
        function o(i, f) {
            if (!n[i]) {
                if (!e[i]) { var c = "function" == typeof require && require; if (!f && c) return c(i, !0); if (u) return u(i, !0); var a = new Error("Cannot find module '" + i + "'"); throw a.code = "MODULE_NOT_FOUND", a }
                var p = n[i] = { exports: {} };
                e[i][0].call(p.exports, function(r) { var n = e[i][1][r]; return o(n || r) }, p, p.exports, r, e, n, t)
            }
            return n[i].exports
        }
        for (var u = "function" == typeof require && require, i = 0; i < t.length; i++) o(t[i]);
        return o
    }
    return r
})()({
    1: [function(require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });

        function init(player, callback) {
            player.gameInstance.framesPerSecond = player.resources.gameSettings.framesPerSecond;
            SupRuntime.Player.updateInterval = 1000 / player.gameInstance.framesPerSecond;
            if (player.resources.gameSettings.ratioNumerator != null && player.resources.gameSettings.ratioDenominator != null) {
                player.gameInstance.setRatio(player.resources.gameSettings.ratioNumerator / player.resources.gameSettings.ratioDenominator);
            }
            // NOTE: Custom layers were introduced in ValjangEngine 0.8
            if (player.resources.gameSettings.customLayers != null) {
                player.gameInstance.layers = player.gameInstance.layers.concat(player.resources.gameSettings.customLayers);
            }
            callback();
        }
        exports.init = init;

        function lateStart(player, callback) {
            const sceneId = player.resources.gameSettings.startupSceneId;
            if (sceneId != null) {
                const outerAsset = player.getOuterAsset(sceneId);
                if (outerAsset != null && outerAsset.type === "scene")
                    window.Sup.loadScene(outerAsset);
            }
            callback();
        }
        exports.lateStart = lateStart;

    }, {}],
    2: [function(require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });

        function loadResource(player, resourceName, callback) {
            player.getAssetData(`resources/${resourceName}/resource.json`, `json`, (err, data) => {
                if (err != null) {
                    callback(err);
                    return;
                }
                callback(null, data);
            });
        }
        exports.loadResource = loadResource;

    }, {}],
    3: [function(require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        const gameSettings = require("./gameSettings");
        const gameSettingsResource = require("./gameSettingsResource");
        SupRuntime.registerPlugin("gameSettings", gameSettings);
        SupRuntime.registerResource("gameSettings", gameSettingsResource);

    }, { "./gameSettings": 1, "./gameSettingsResource": 2 }]
}, {}, [3]);