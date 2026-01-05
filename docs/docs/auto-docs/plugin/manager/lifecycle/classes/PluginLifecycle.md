[API Docs](/)

***

# Class: PluginLifecycle

Defined in: [src/plugin/manager/lifecycle.ts:40](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/lifecycle.ts#L40)

## Constructors

### Constructor

> **new PluginLifecycle**(`pluginContext`, `loadedPlugins`, `extensionRegistry`): `PluginLifecycle`

Defined in: [src/plugin/manager/lifecycle.ts:41](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/lifecycle.ts#L41)

#### Parameters

##### pluginContext

[`IPluginContext`](../../../types/interfaces/IPluginContext.md)

##### loadedPlugins

`Map`\<`string`, [`ILoadedPlugin`](../../../types/interfaces/ILoadedPlugin.md)\>

##### extensionRegistry

[`IExtensionRegistry`](../../../types/interfaces/IExtensionRegistry.md)

#### Returns

`PluginLifecycle`

## Methods

### activatePlugin()

> **activatePlugin**(`pluginId`, `pluginManager`): `Promise`\<`boolean`\>

Defined in: [src/plugin/manager/lifecycle.ts:132](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/lifecycle.ts#L132)

Activate a plugin - trigger schema rebuild

#### Parameters

##### pluginId

`string`

##### pluginManager

`IPluginManager`

#### Returns

`Promise`\<`boolean`\>

***

### deactivatePlugin()

> **deactivatePlugin**(`pluginId`, `pluginManager`, `dropTables`): `Promise`\<`boolean`\>

Defined in: [src/plugin/manager/lifecycle.ts:188](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/lifecycle.ts#L188)

Deactivate a plugin - trigger schema rebuild

#### Parameters

##### pluginId

`string`

##### pluginManager

`IPluginManager`

##### dropTables

`boolean` = `false`

#### Returns

`Promise`\<`boolean`\>

***

### getPluginModule()

> **getPluginModule**(`pluginId`): `Promise`\<[`IPluginLifecycle`](../../../types/interfaces/IPluginLifecycle.md) \| `null`\>

Defined in: [src/plugin/manager/lifecycle.ts:375](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/lifecycle.ts#L375)

Get plugin module for lifecycle hooks

#### Parameters

##### pluginId

`string`

#### Returns

`Promise`\<[`IPluginLifecycle`](../../../types/interfaces/IPluginLifecycle.md) \| `null`\>

***

### installPlugin()

> **installPlugin**(`pluginId`, `pluginManager`): `Promise`\<`boolean`\>

Defined in: [src/plugin/manager/lifecycle.ts:50](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/lifecycle.ts#L50)

Install a plugin - install dependencies and create plugin-defined databases

#### Parameters

##### pluginId

`string`

##### pluginManager

`IPluginManager`

#### Returns

`Promise`\<`boolean`\>

***

### removeFromExtensionRegistry()

> **removeFromExtensionRegistry**(`pluginId`): `void`

Defined in: [src/plugin/manager/lifecycle.ts:395](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/lifecycle.ts#L395)

Remove plugin from extension registry

#### Parameters

##### pluginId

`string`

#### Returns

`void`

***

### uninstallPlugin()

> **uninstallPlugin**(`pluginId`, `pluginManager`): `Promise`\<`boolean`\>

Defined in: [src/plugin/manager/lifecycle.ts:90](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/lifecycle.ts#L90)

Uninstall a plugin - remove tables and cleanup

#### Parameters

##### pluginId

`string`

##### pluginManager

`IPluginManager`

#### Returns

`Promise`\<`boolean`\>

***

### unloadPlugin()

> **unloadPlugin**(`pluginId`, `pluginManager`): `Promise`\<`boolean`\>

Defined in: [src/plugin/manager/lifecycle.ts:521](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/lifecycle.ts#L521)

Unload a plugin - remove from memory without database changes

#### Parameters

##### pluginId

`string`

##### pluginManager

`IPluginManager`

#### Returns

`Promise`\<`boolean`\>
