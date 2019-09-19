"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Audio {
    constructor() { }
    getContext() {
        if (this.ctx != null)
            return this.ctx;
        if (window.AudioContext == null)
            return null;
        this.ctx = new AudioContext();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 1;
        this.masterGain.connect(this.ctx.destination);
        return this.ctx;
    }
}
exports.default = Audio;
