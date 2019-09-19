(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const THREE = SupEngine.THREE;
function init(player, callback) {
    switch (player.resources.lightSettings.shadowMapType) {
        case "basic":
            player.gameInstance.threeRenderer.shadowMap.type = THREE.BasicShadowMap;
            break;
        case "pcf":
            player.gameInstance.threeRenderer.shadowMap.type = THREE.PCFShadowMap;
            break;
        case "pcfSoft":
            player.gameInstance.threeRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
            break;
    }
    callback();
}
exports.init = init;
function setupComponent(player, component, config) {
    component.__outer.type = ["ambient", "point", "spot", "directional"].indexOf(config.type);
    component.color = parseInt(config.color, 16);
    component.intensity = config.intensity;
    component.distance = config.distance;
    component.angle = config.angle;
    component.target.set(config.target.x, config.target.y, config.target.z);
    component.castShadow = config.castShadow;
    component.shadow.mapSize.set(config.shadowMapSize.width, config.shadowMapSize.height);
    component.shadow.bias = config.shadowBias;
    component.shadow.camera.near = config.shadowCameraNearPlane;
    component.shadow.camera.far = config.shadowCameraFarPlane;
    component.shadow.camera.fov = config.shadowCameraFov;
    component.shadow.camera.left = config.shadowCameraSize.left;
    component.shadow.camera.right = config.shadowCameraSize.right;
    component.shadow.camera.top = config.shadowCameraSize.top;
    component.shadow.camera.bottom = config.shadowCameraSize.bottom;
    component.setType(config.type);
}
exports.setupComponent = setupComponent;

},{}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Light = require("./Light");
const lightSettingsResource = require("./lightSettingsResource");
SupRuntime.registerPlugin("Light", Light);
SupRuntime.registerResource("lightSettings", lightSettingsResource);

},{"./Light":1,"./lightSettingsResource":3}],3:[function(require,module,exports){
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

},{}]},{},[2]);
