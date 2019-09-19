(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
/// <reference path="../../../default/typescript/typescriptAPI/TypeScriptAPIPlugin.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });

SupCore.system.registerPlugin("typescriptAPI", "Sup.Tween", {
    code: "declare let TWEEN;\r\n\r\nnamespace Sup {\r\n  export class Tween extends ActorComponent {\r\n    __inner: any;\r\n    tween: any;\r\n    timer: number;\r\n\r\n    constructor(actor, object) {\r\n      super(actor);\r\n      this.tween = new TWEEN.Tween(object);\r\n\r\n      this.tween.onComplete(() => { this.destroy(); });\r\n      this.timer = -1;\r\n\r\n      let funcs = {};\r\n      funcs[\"update\"] = this.update.bind(this)\r\n      this.__inner = new SupEngine.componentClasses.Behavior(actor.__inner, funcs);\r\n    }\r\n    update() {\r\n      if (this.timer == -1) return;\r\n\r\n      this.timer += 1 / Game.getFPS();\r\n      this.tween.update(this.timer * 1000);\r\n    }\r\n\r\n    to(object, duration) {\r\n      this.tween.to(object, duration);\r\n      return this;\r\n    }\r\n    delay(amount) {\r\n      this.tween.delay(amount);\r\n      return this;\r\n    }\r\n    easing(easing) {\r\n      this.tween.easing(easing);\r\n      return this;\r\n    }\r\n    yoyo(yoyo) {\r\n      this.tween.yoyo(yoyo);\r\n      return this;\r\n    }\r\n    repeat(times) {\r\n      this.tween.repeat(times);\r\n      return this;\r\n    }\r\n    onUpdate(update) {\r\n      this.tween.onUpdate(function() {\r\n        update(this);\r\n      });\r\n      return this;\r\n    }\r\n    onComplete(complete) {\r\n      let self = this;\r\n      this.tween.onComplete(function() {\r\n        complete(this);\r\n        self.destroy();\r\n      });\r\n      return this;\r\n    }\r\n    start() {\r\n      this.timer = 0;\r\n      this.tween.start(this.timer);\r\n      return this;\r\n    }\r\n    stop() {\r\n      this.tween.stop();\r\n      this.timer = -1;\r\n    }\r\n  }\r\n}\r\n",
    defs: "declare namespace Sup {\r\n  class Tween {\r\n    constructor(actor: Sup.Actor, object: Object);\r\n\r\n    to(object: Object, duration: number): Tween;\r\n    delay(amount: number): Tween;\r\n    \r\n    // Use TWEEN.Easing.*\r\n    // See http://sole.github.io/tween.js/examples/03_graphs.html\r\n    // for visual representations of each easing mode\r\n    easing(easing: (k: number) => number): Tween;\r\n\r\n    yoyo(yoyo: boolean): Tween;\r\n    repeat(times: number): Tween;\r\n\r\n    onUpdate(onUpdate: Function): Tween;\r\n    onComplete(onComplete: Function): Tween;\r\n\r\n    start(): Tween;\r\n    stop(): Tween;\r\n  }\r\n}\r\n"
});
SupCore.system.registerPlugin("typescriptAPI", "TWEEN", {
    defs: "// Type definitions for tween.js r12\r\n// Project: https://github.com/sole/tween.js/\r\n// Definitions by: sunetos <https://github.com/sunetos>, jzarnikov <https://github.com/jzarnikov>\r\n// Definitions: https://github.com/borisyankov/DefinitelyTyped\r\n\r\ndeclare module TWEEN {\r\n  export var REVISION: string;\r\n  export function getAll(): Tween[];\r\n  export function removeAll(): void;\r\n  export function add(tween:Tween): void;\r\n  export function remove(tween:Tween): void;\r\n  export function update(time?:number): boolean;\r\n\r\n  export class Tween {\r\n    constructor(object?:any);\r\n    to(properties:any, duration:number): Tween;\r\n    start(time?:number): Tween;\r\n    stop(): Tween;\r\n    delay(amount:number): Tween;\r\n    easing(easing: (k: number) => number): Tween;\r\n    interpolation(interpolation: (v:number[], k:number) => number): Tween;\r\n    chain(...tweens:Tween[]): Tween;\r\n    onStart(callback: (object?: any) => void): Tween;\r\n    onUpdate(callback: (object?: any) => void): Tween;\r\n    onComplete(callback: (object?: any) => void): Tween;\r\n    update(time: number): boolean;\r\n    repeat(times: number): Tween;\r\n    yoyo(enable: boolean): Tween;\r\n  }\r\n  export var Easing: TweenEasing;\r\n  export var Interpolation: TweenInterpolation;\r\n}\r\n\r\n// See http://sole.github.io/tween.js/examples/03_graphs.html\r\n// for visual representations of each easing mode\r\n\r\ninterface TweenEasing {\r\n  Linear: {\r\n    None(k:number): number;\r\n  };\r\n  Quadratic: {\r\n    In(k:number): number;\r\n    Out(k:number): number;\r\n    InOut(k:number): number;\r\n  };\r\n  Cubic: {\r\n    In(k:number): number;\r\n    Out(k:number): number;\r\n    InOut(k:number): number;\r\n  };\r\n  Quartic: {\r\n    In(k:number): number;\r\n    Out(k:number): number;\r\n    InOut(k:number): number;\r\n  };\r\n  Quintic: {\r\n    In(k:number): number;\r\n    Out(k:number): number;\r\n    InOut(k:number): number;\r\n  };\r\n  Sinusoidal: {\r\n    In(k:number): number;\r\n    Out(k:number): number;\r\n    InOut(k:number): number;\r\n  };\r\n  Exponential: {\r\n    In(k:number): number;\r\n    Out(k:number): number;\r\n    InOut(k:number): number;\r\n  };\r\n  Circular: {\r\n    In(k:number): number;\r\n    Out(k:number): number;\r\n    InOut(k:number): number;\r\n  };\r\n  Elastic: {\r\n    In(k:number): number;\r\n    Out(k:number): number;\r\n    InOut(k:number): number;\r\n  };\r\n  Back: {\r\n    In(k:number): number;\r\n    Out(k:number): number;\r\n    InOut(k:number): number;\r\n  };\r\n  Bounce: {\r\n    In(k:number): number;\r\n    Out(k:number): number;\r\n    InOut(k:number): number;\r\n  };\r\n}\r\n\r\ninterface TweenInterpolation {\r\n  Linear(v:number[], k:number): number;\r\n  Bezier(v:number[], k:number): number;\r\n  CatmullRom(v:number[], k:number): number;\r\n\r\n  Utils: {\r\n    Linear(p0:number, p1:number, t:number): number;\r\n    Bernstein(n:number, i:number): number;\r\n    Factorial(n): number;\r\n  };\r\n}\r\n",
    code: ""
});

},{}]},{},[1]);
