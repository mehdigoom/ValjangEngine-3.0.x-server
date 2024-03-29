export interface TextRendererConfigPub {
  formatVersion?: number;

  fontAssetId: string;
  text: string;
  alignment: string;
  verticalAlignment?: string;
  size?: number;
  color?: string;

  overrideOpacity?: boolean;
  opacity?: number;
}

export default class TextRendererConfig extends SupCore.Data.Base.ComponentConfig {
  static schema: SupCore.Data.Schema = {
    formatVersion: { type: "integer" },

    fontAssetId: { type: "string?", min: 0, mutable: true },
    text: { type: "string", min: 0, mutable: true },
    alignment: { type: "enum", items: [ "left", "center", "right" ], mutable: true },
    verticalAlignment: { type: "enum", items: [ "top", "center", "bottom" ], mutable: true },
    size: { type: "integer?", min: 0, mutable: true },
    color: { type: "string?", length: 6, mutable: true },

    overrideOpacity: { type: "boolean", mutable: true },
    opacity: { type: "number?", min: 0, max: 1, mutable: true }
  };

  static create() {
    const emptyConfig: TextRendererConfigPub = {
      formatVersion: TextRendererConfig.currentFormatVersion,

      fontAssetId: null,
      text: "Text",
      alignment: "center",
      verticalAlignment: "center",
      size: null,
      color: null,

      overrideOpacity: false,
      opacity: null
    };
    return emptyConfig;
  }

  static currentFormatVersion = 2;
  static migrate(pub: TextRendererConfigPub) {
    if (pub.formatVersion === TextRendererConfig.currentFormatVersion) return false;

    if (pub.formatVersion == null) {
      pub.formatVersion = 1;

      // NOTE: Legacy stuff from ValjangEngine 0.7
      if (pub.color != null && pub.color.length !== 6) pub.color = "ffffff";

      // NOTE: Migration from old "align" property
      if ((pub as any).align != null) { pub.alignment = (pub as any).align; delete (pub as any).align; }
      if (pub.verticalAlignment == null) pub.verticalAlignment = "center";
    }

    if (pub.formatVersion === 1) {
      pub.overrideOpacity = false;
      pub.opacity = null;

      pub.formatVersion = 2;
    }

    return true;
  }

  pub: TextRendererConfigPub;
  constructor(pub: TextRendererConfigPub) { super(pub, TextRendererConfig.schema); }

  restore() { if (this.pub.fontAssetId != null) this.emit("addDependencies", [ this.pub.fontAssetId ]); }
  destroy() { if (this.pub.fontAssetId != null) this.emit("removeDependencies", [ this.pub.fontAssetId ]); }

  setProperty(path: string, value: any, callback: (err: string, actualValue?: any) => any) {
    let oldDepId: string;
    if (path === "fontAssetId") oldDepId = this.pub.fontAssetId;

    super.setProperty(path, value, (err, actualValue) => {
      if (err != null) { callback(err); return; }

      if (path === "fontAssetId") {
        if (oldDepId != null) this.emit("removeDependencies", [ oldDepId ]);
        if (actualValue != null) this.emit("addDependencies", [ actualValue ]);
      }

      callback(null, actualValue);
    });
  }
}
