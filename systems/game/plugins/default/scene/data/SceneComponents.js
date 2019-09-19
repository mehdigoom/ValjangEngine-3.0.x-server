"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class SceneComponents extends SupCore.Data.Base.ListById {
    constructor(pub, sceneAsset) {
        super(pub, SceneComponents.schema);
        this.configsById = {};
        this.sceneAsset = sceneAsset;
        const system = (this.sceneAsset.server != null) ? this.sceneAsset.server.system : SupCore.system;
        const componentConfigClasses = system.getPlugins("componentConfigs");
        for (const item of this.pub) {
            const componentConfigClass = componentConfigClasses[item.type];
            if (componentConfigClass == null) {
                if (sceneAsset != null) {
                    const scenePath = sceneAsset.server.data.entries.getPathFromId(sceneAsset.id);
                    throw new Error(`Could not find component config class for type ${item.type} in scene ${scenePath} ` +
                        `of project ${sceneAsset.server.data.manifest.pub.name} (${sceneAsset.server.data.manifest.pub.id})`);
                }
                else {
                    throw new Error(`Could not find component config class for type ${item.type}`);
                }
            }
            this.configsById[item.id] = new componentConfigClass(item.config, this.sceneAsset);
        }
    }
    add(component, index, callback) {
        super.add(component, index, (err, actualIndex) => {
            if (err != null) {
                callback(err, null);
                return;
            }
            const componentConfigClass = this.sceneAsset.server.system.getPlugins("componentConfigs")[component.type];
            this.configsById[component.id] = new componentConfigClass(component.config, this.sceneAsset);
            callback(null, actualIndex);
        });
    }
    client_add(component, index) {
        super.client_add(component, index);
        const componentConfigClass = SupCore.system.getPlugins("componentConfigs")[component.type];
        this.configsById[component.id] = new componentConfigClass(component.config);
    }
    remove(id, callback) {
        super.remove(id, (err) => {
            if (err != null) {
                callback(err);
                return;
            }
            this.configsById[id].destroy();
            delete this.configsById[id];
            callback(null);
        });
    }
    client_remove(id) {
        super.client_remove(id);
        delete this.configsById[id];
    }
}
SceneComponents.schema = {
    type: { type: "string" },
    config: { type: "any" },
};
exports.default = SceneComponents;
