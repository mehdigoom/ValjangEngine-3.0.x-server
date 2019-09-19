(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
/// <reference path="../../../default/typescript/typescriptAPI/TypeScriptAPIPlugin.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });

SupCore.system.registerPlugin("typescriptAPI", "EventEmitter", {
    code: null,
    defs: "// Definitions for node.js v4.2.4\r\ndeclare class EventEmitter {\r\n  on(event: string, listener: Function): EventEmitter;\r\n  addListener(event: string, listener: Function): EventEmitter;\r\n  once(event: string, listener: Function): EventEmitter;\r\n  \r\n  removeListener(event: string, listener: Function): EventEmitter;\r\n  removeAllListeners(event?: string): EventEmitter;\r\n  \r\n  emit(event: string, ...args: any[]): boolean;\r\n\r\n  static defaultMaxListeners: number;\r\n  setMaxListeners(n: number): EventEmitter;\r\n  getMaxListener(): number\r\n\r\n  listeners(event: string): Function[];\r\n  listenerCount(event: string): number;  \r\n  static listenerCount(emitter: EventEmitter, event: string): number; // deprecated\r\n}\r\n"
});

},{}]},{},[1]);
