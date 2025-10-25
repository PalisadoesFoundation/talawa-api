[Admin Docs](/)

***

# Class: PluginLifecycle

Defined in: [src/plugin/manager/lifecycle.ts:35](https://github.com/Sourya07/talawa-api/blob/583d62db9438de398bb9012a4a2617e2cb268b08/src/plugin/manager/lifecycle.ts#L35)

## Constructors

### Constructor

> **new PluginLifecycle**(`pluginContext`, `loadedPlugins`, `extensionRegistry`): `PluginLifecycle`

Defined in: [src/plugin/manager/lifecycle.ts:36](https://github.com/Sourya07/talawa-api/blob/583d62db9438de398bb9012a4a2617e2cb268b08/src/plugin/manager/lifecycle.ts#L36)

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

Defined in: [src/plugin/manager/lifecycle.ts:121](https://github.com/Sourya07/talawa-api/blob/583d62db9438de398bb9012a4a2617e2cb268b08/src/plugin/manager/lifecycle.ts#L121)

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

Defined in: [src/plugin/manager/lifecycle.ts:176](https://github.com/Sourya07/talawa-api/blob/583d62db9438de398bb9012a4a2617e2cb268b08/src/plugin/manager/lifecycle.ts#L176)

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

> **getPluginModule**(`pluginId`): `Promise`\<`null` \| [`IPluginLifecycle`](../../../types/interfaces/IPluginLifecycle.md)\>

Defined in: [src/plugin/manager/lifecycle.ts:360](https://github.com/Sourya07/talawa-api/blob/583d62db9438de398bb9012a4a2617e2cb268b08/src/plugin/manager/lifecycle.ts#L360)

Get plugin module for lifecycle hooks

#### Parameters

##### pluginId

`string`

#### Returns

`Promise`\<`null` \| [`IPluginLifecycle`](../../../types/interfaces/IPluginLifecycle.md)\>

***

### installPlugin()

> **installPlugin**(`pluginId`, `pluginManager`): `Promise`\<`boolean`\>

Defined in: [src/plugin/manager/lifecycle.ts:45](https://github.com/Sourya07/talawa-api/blob/583d62db9438de398bb9012a4a2617e2cb268b08/src/plugin/manager/lifecycle.ts#L45)

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

Defined in: [src/plugin/manager/lifecycle.ts:380](https://github.com/Sourya07/talawa-api/blob/583d62db9438de398bb9012a4a2617e2cb268b08/src/plugin/manager/lifecycle.ts#L380)

Remove plugin from extension registry

#### Parameters

##### pluginId

`string`

#### Returns

`void`

***

### uninstallPlugin()

> **uninstallPlugin**(`pluginId`, `pluginManager`): `Promise`\<`boolean`\>

Defined in: [src/plugin/manager/lifecycle.ts:82](https://github.com/Sourya07/talawa-api/blob/583d62db9438de398bb9012a4a2617e2cb268b08/src/plugin/manager/lifecycle.ts#L82)

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

Defined in: [src/plugin/manager/lifecycle.ts:506](https://github.com/Sourya07/talawa-api/blob/583d62db9438de398bb9012a4a2617e2cb268b08/src/plugin/manager/lifecycle.ts#L506)

Unload a plugin - remove from memory without database changes

#### Parameters

##### pluginId

`string`

##### pluginManager

`IPluginManager`

#### Returns

`Promise`\<`boolean`\>
