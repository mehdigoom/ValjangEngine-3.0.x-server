(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const port = (window.location.port.length === 0) ? (window.location.protocol === "https" ? "443" : "80") : window.location.port;
const connectingElt = document.querySelector(".connecting");
const formElt = document.querySelector(".login");
formElt.hidden = true;
let serverName;
SupClient.fetch("ValjangEngine.json", "json", (err, serverInfo) => {
    serverName = serverInfo.serverName;
    SupClient.i18n.load([{ root: "/", name: "hub" }, { root: "/", name: "login" }], start);
});
function start() {
    if (serverName == null)
        serverName = SupClient.i18n.t(`hub:serverAddress`, { hostname: window.location.hostname, port });
    document.querySelector(".server-name").textContent = serverName;
    formElt.hidden = false;
    connectingElt.hidden = true;
}

},{}]},{},[1]);
