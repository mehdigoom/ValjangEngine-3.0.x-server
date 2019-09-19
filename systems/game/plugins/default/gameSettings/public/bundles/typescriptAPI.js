(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
/// <reference path="../../typescript/typescriptAPI/TypeScriptAPIPlugin.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });

SupCore.system.registerPlugin("typescriptAPI", "Sup.Game", {
    code: "namespace Sup {\r\n  export namespace Game {\r\n    export function getFPS() { return player.resources.gameSettings.framesPerSecond; }\r\n    export function getScreenRatio() {\r\n      let width = player.resources.gameSettings.ratioNumerator;\r\n      let height = player.resources.gameSettings.ratioDenominator;\r\n      return { width, height };\r\n    }\r\n  }\r\n}\r\n",
    defs: "declare namespace Sup {\r\n  namespace Game {\r\n    function getFPS(): number;\r\n    function getScreenRatio(): { width: number; height: number; };\r\n  }\r\n}\r\n"
});

},{}]},{},[1]);
