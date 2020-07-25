export function importActor(entry: SupCore.Data.EntryNode, projectClient: SupClient.ProjectClient, options: SupClient.ImportIntoScenePluginOptions,
callback: (err: string, nodeId: string) => any) {
  let name = entry.name;
  if (name === "Cubic Model") {
    const parentNode = projectClient.entries.parentNodesById[entry.id];
    if (parentNode != null) name = parentNode.name;
  }

  projectClient.editAsset(SupClient.query.asset, "addNode", name, options, (nodeId: string) => {
    importComponent(entry, projectClient, nodeId, (err) => { callback(err, nodeId); } );
  });
}

export function importComponent(entry: SupCore.Data.EntryNode, projectClient: SupClient.ProjectClient, nodeId: string, callback: (err: string, nodeId: string) => any) {
  projectClient.editAsset(SupClient.query.asset, "addComponent", nodeId, "CubicModelRenderer", null, (componentId: string) => {
    projectClient.editAsset(SupClient.query.asset, "editComponent", nodeId, componentId, "setProperty", "cubicModelAssetId", entry.id, callback);
  });
}