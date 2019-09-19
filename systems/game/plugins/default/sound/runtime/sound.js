"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function loadAsset(player, entry, callback) {
    const sound = { buffer: null };
    if (player.gameInstance.audio.getContext() == null) {
        setTimeout(() => { callback(null, sound); }, 0);
        return;
    }
    player.getAssetData(`assets/${entry.storagePath}/sound.json`, "json", (err, data) => {
        player.getAssetData(`assets/${entry.storagePath}/sound.dat`, "arraybuffer", (err, soundData) => {
            if (err != null) {
                callback(err);
                return;
            }
            if (data.streaming) {
                const typedArray = new Uint8Array(soundData);
                const blob = new Blob([typedArray], { type: "audio/*" });
                sound.buffer = URL.createObjectURL(blob);
                setTimeout(() => { callback(null, sound); }, 0);
            }
            else {
                const onLoad = (buffer) => { sound.buffer = buffer; callback(null, sound); };
                const onError = () => { callback(null, sound); };
                player.gameInstance.audio.getContext().decodeAudioData(soundData, onLoad, onError);
            }
        });
    });
}
exports.loadAsset = loadAsset;
function createOuterAsset(player, asset) { return new window.Sup.Sound(asset); }
exports.createOuterAsset = createOuterAsset;
