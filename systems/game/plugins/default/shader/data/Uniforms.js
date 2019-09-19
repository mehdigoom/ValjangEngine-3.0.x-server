"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Uniforms extends SupCore.Data.Base.ListById {
    constructor(pub) {
        super(pub, Uniforms.schema);
    }
    setProperty(id, key, value, callback) {
        function checkArray(value, size) {
            if (!Array.isArray(value))
                return false;
            if (value.length !== size)
                return false;
            for (const item of value)
                if (typeof item !== "number")
                    return false;
            return true;
        }
        if (key === "value") {
            const item = this.byId[id];
            switch (item.type) {
                case "f":
                    if (typeof value !== "number") {
                        callback("Invalid value", null);
                        return;
                    }
                    break;
                case "c":
                case "v3":
                    if (!checkArray(value, 3)) {
                        callback("Invalid value", null);
                        return;
                    }
                    break;
                case "v2":
                    if (!checkArray(value, 2)) {
                        callback("Invalid value", null);
                        return;
                    }
                    break;
                case "v4":
                    if (!checkArray(value, 4)) {
                        callback("Invalid value", null);
                        return;
                    }
                    break;
                case "t":
                    if (typeof value !== "string") {
                        callback("Invalid value", null);
                        return;
                    }
                    break;
            }
        }
        super.setProperty(id, key, value, (err, value) => {
            if (err != null) {
                callback(err, null);
                return;
            }
            callback(null, value);
            if (key === "type")
                this.updateItemValue(id, value);
        });
    }
    client_setProperty(id, key, value) {
        super.client_setProperty(id, key, value);
        if (key === "type")
            this.updateItemValue(id, value);
    }
    updateItemValue(id, value) {
        const item = this.byId[id];
        switch (value) {
            case "f":
                item.value = 0;
                break;
            case "c":
                item.value = [1, 1, 1];
                break;
            case "v2":
                item.value = [0, 0];
                break;
            case "v3":
                item.value = [0, 0, 0];
                break;
            case "v4":
                item.value = [0, 0, 0, 0];
                break;
            case "t":
                item.value = "map";
                break;
        }
    }
}
Uniforms.schema = {
    name: { type: "string", minLength: 1, maxLength: 80, mutable: true },
    type: { type: "enum", items: ["f", "c", "v2", "v3", "v4", "t"], mutable: true },
    value: { type: "any", mutable: true }
};
exports.default = Uniforms;
