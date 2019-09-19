class ComponentConfig extends SupCore.Data.Base.Hash {
    constructor(pub, schema) {
        super(pub, schema);
    }
    migrate() { return false; }
    restore() { }
    destroy() { }
    server_setProperty(client, path, value, callback) {
        this.setProperty(path, value, (err, actualValue) => {
            if (err != null) {
                callback(err);
                return;
            }
            callback(null, path, actualValue);
        });
    }
}
SupCore.Data.Base.ComponentConfig = ComponentConfig;
