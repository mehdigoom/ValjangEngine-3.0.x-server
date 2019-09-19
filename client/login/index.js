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
