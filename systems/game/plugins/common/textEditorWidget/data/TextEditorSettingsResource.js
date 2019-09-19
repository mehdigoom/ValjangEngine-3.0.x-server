"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class TextEditorSettingsResource extends SupCore.Data.Base.Resource {
    constructor(id, pub, server) {
        super(id, pub, TextEditorSettingsResource.schema, server);
    }
    init(callback) {
        this.pub = {
            tabSize: 2,
            softTab: true
        };
        super.init(callback);
    }
}
TextEditorSettingsResource.schema = {
    tabSize: { type: "number", min: 1, mutable: true },
    softTab: { type: "boolean", mutable: true },
};
exports.default = TextEditorSettingsResource;
