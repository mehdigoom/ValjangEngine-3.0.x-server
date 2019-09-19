"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class TextRendererUpdater {
    constructor(client, textRenderer, config, externalSubscriber) {
        this.client = client;
        this.textRenderer = textRenderer;
        this.externalSubscriber = externalSubscriber;
        this.onFontAssetReceived = (assetId, asset) => {
            this.fontAsset = asset;
            this.textRenderer.setText(this.text);
            this.textRenderer.setOptions(this.options);
            if (!this.overrideOpacity)
                this.textRenderer.opacity = asset.pub.opacity;
            this.setupFont();
            if (this.externalSubscriber.onAssetReceived)
                this.externalSubscriber.onAssetReceived(assetId, asset);
        };
        this.onFontAssetEdited = (assetId, command, ...args) => {
            const commandFunction = this.onEditCommands[command];
            if (commandFunction != null)
                commandFunction.apply(this, args);
            if (this.externalSubscriber.onAssetEdited)
                this.externalSubscriber.onAssetEdited(assetId, command, ...args);
        };
        this.onEditCommands = {
            upload: () => { this.setupFont(); },
            setProperty: (path, value) => {
                switch (path) {
                    case "isBitmap":
                        this.setupFont();
                        break;
                    case "opacity":
                        if (!this.overrideOpacity)
                            this.textRenderer.setOpacity(value);
                        break;
                    default: this.textRenderer.setFont(this.fontAsset.pub);
                }
            }
        };
        this.onFontAssetTrashed = (assetId) => {
            this.textRenderer.clearMesh();
            if (this.externalSubscriber.onAssetTrashed != null)
                this.externalSubscriber.onAssetTrashed(assetId);
        };
        this.fontAssetId = config.fontAssetId;
        this.text = config.text;
        this.options = {
            alignment: config.alignment,
            verticalAlignment: config.verticalAlignment,
            size: config.size,
            color: config.color,
        };
        this.overrideOpacity = config.overrideOpacity;
        this.opacity = config.opacity;
        if (this.overrideOpacity)
            this.textRenderer.setOpacity(this.opacity);
        if (this.externalSubscriber == null)
            this.externalSubscriber = {};
        this.fontSubscriber = {
            onAssetReceived: this.onFontAssetReceived,
            onAssetEdited: this.onFontAssetEdited,
            onAssetTrashed: this.onFontAssetTrashed
        };
        if (this.fontAssetId != null)
            this.client.subAsset(this.fontAssetId, "font", this.fontSubscriber);
    }
    destroy() {
        if (this.fontAssetId != null)
            this.client.unsubAsset(this.fontAssetId, this.fontSubscriber);
    }
    config_setProperty(path, value) {
        switch (path) {
            case "fontAssetId":
                {
                    if (this.fontAssetId != null)
                        this.client.unsubAsset(this.fontAssetId, this.fontSubscriber);
                    this.fontAssetId = value;
                    this.fontAsset = null;
                    this.textRenderer.setFont(null);
                    if (this.fontAssetId != null)
                        this.client.subAsset(this.fontAssetId, "font", this.fontSubscriber);
                }
                break;
            case "text":
                {
                    this.text = value;
                    this.textRenderer.setText(this.text);
                }
                break;
            case "alignment":
            case "verticalAlignment":
            case "size":
            case "color":
                {
                    this.options[path] = (value !== "") ? value : null;
                    this.textRenderer.setOptions(this.options);
                }
                break;
            case "overrideOpacity":
            case "opacity":
                {
                    this[path] = value;
                    if (this.overrideOpacity)
                        this.textRenderer.setOpacity(this.opacity);
                    else if (this.fontAsset != null)
                        this.textRenderer.setOpacity(this.fontAsset.pub.opacity);
                }
                break;
        }
    }
    setupFont() {
        this.textRenderer.clearMesh();
        if (this.fontAsset.pub.isBitmap) {
            if (this.fontAsset.pub.texture != null) {
                const image = this.fontAsset.pub.texture.image;
                if (image.complete)
                    this.textRenderer.setFont(this.fontAsset.pub);
                else
                    image.addEventListener("load", () => { this.textRenderer.setFont(this.fontAsset.pub); });
            }
        }
        else {
            if (this.fontAsset.font == null)
                this.textRenderer.setFont(this.fontAsset.pub);
            else {
                this.fontAsset.font.load().then(() => { this.textRenderer.setFont(this.fontAsset.pub); }, () => { this.textRenderer.setFont(this.fontAsset.pub); });
            }
        }
    }
}
exports.default = TextRendererUpdater;
