"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function setupComponent(player, component, config) {
    component.setText(config.text);
    component.setOptions({ alignment: config.alignment, verticalAlignment: config.verticalAlignment, size: config.size, color: config.color });
    if (config.overrideOpacity)
        component.opacity = config.opacity;
    if (config.fontAssetId != null) {
        const font = player.getOuterAsset(config.fontAssetId).__inner;
        if (!config.overrideOpacity)
            component.opacity = font.opacity;
        component.setFont(font);
    }
}
exports.setupComponent = setupComponent;
