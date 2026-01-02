[API Docs](/)

***

# Class: PluginManager

Defined in: [src/plugin/manager/core.ts:32](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L32)

Plugin System Main Entry Point for Talawa API

This file exports all the main plugin system components and utilities
for use throughout the API application.

## Extends

- `EventEmitter`

## Constructors

### Constructor

> **new PluginManager**(`context`, `pluginsDir?`): `PluginManager`

Defined in: [src/plugin/manager/core.ts:61](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L61)

#### Parameters

##### context

[`IPluginContext`](../types/interfaces/IPluginContext.md)

##### pluginsDir?

`string`

#### Returns

`PluginManager`

#### Overrides

`EventEmitter.constructor`

## Methods

### activatePlugin()

> **activatePlugin**(`pluginId`): `Promise`\<`boolean`\>

Defined in: [src/plugin/manager/core.ts:322](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L322)

Activate a plugin

#### Parameters

##### pluginId

`string`

#### Returns

`Promise`\<`boolean`\>

***

### clearErrors()

> **clearErrors**(): `void`

Defined in: [src/plugin/manager/core.ts:488](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L488)

Clear plugin errors

#### Returns

`void`

***

### deactivatePlugin()

> **deactivatePlugin**(`pluginId`, `dropTables`): `Promise`\<`boolean`\>

Defined in: [src/plugin/manager/core.ts:329](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L329)

Deactivate a plugin

#### Parameters

##### pluginId

`string`

##### dropTables

`boolean` = `false`

#### Returns

`Promise`\<`boolean`\>

***

### executePostHooks()

> **executePostHooks**(`event`, `data`): `Promise`\<`void`\>

Defined in: [src/plugin/manager/core.ts:461](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L461)

Execute post hooks for an event

#### Parameters

##### event

`string`

##### data

`unknown`

#### Returns

`Promise`\<`void`\>

***

### executePreHooks()

> **executePreHooks**(`event`, `data`): `Promise`\<`unknown`\>

Defined in: [src/plugin/manager/core.ts:443](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L443)

Execute pre hooks for an event

#### Parameters

##### event

`string`

##### data

`unknown`

#### Returns

`Promise`\<`unknown`\>

***

### getActivePlugins()

> **getActivePlugins**(): [`ILoadedPlugin`](../types/interfaces/ILoadedPlugin.md)[]

Defined in: [src/plugin/manager/core.ts:405](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L405)

Get active plugins

#### Returns

[`ILoadedPlugin`](../types/interfaces/ILoadedPlugin.md)[]

***

### getErrors()

> **getErrors**(): [`IPluginError`](../types/interfaces/IPluginError.md)[]

Defined in: [src/plugin/manager/core.ts:481](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L481)

Get plugin errors

#### Returns

[`IPluginError`](../types/interfaces/IPluginError.md)[]

***

### getExtensionRegistry()

> **getExtensionRegistry**(): [`IExtensionRegistry`](../types/interfaces/IExtensionRegistry.md)

Defined in: [src/plugin/manager/core.ts:436](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L436)

Get extension registry

#### Returns

[`IExtensionRegistry`](../types/interfaces/IExtensionRegistry.md)

***

### getLoadedPluginIds()

> **getLoadedPluginIds**(): `string`[]

Defined in: [src/plugin/manager/core.ts:398](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L398)

Get loaded plugin IDs

#### Returns

`string`[]

***

### getLoadedPlugins()

> **getLoadedPlugins**(): [`ILoadedPlugin`](../types/interfaces/ILoadedPlugin.md)[]

Defined in: [src/plugin/manager/core.ts:391](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L391)

Get all loaded plugins

#### Returns

[`ILoadedPlugin`](../types/interfaces/ILoadedPlugin.md)[]

***

### getPlugin()

> **getPlugin**(`pluginId`): [`ILoadedPlugin`](../types/interfaces/ILoadedPlugin.md) \| `undefined`

Defined in: [src/plugin/manager/core.ts:414](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L414)

Get a specific plugin

#### Parameters

##### pluginId

`string`

#### Returns

[`ILoadedPlugin`](../types/interfaces/ILoadedPlugin.md) \| `undefined`

***

### getPluginContext()

> **getPluginContext**(): [`IPluginContext`](../types/interfaces/IPluginContext.md)

Defined in: [src/plugin/manager/core.ts:509](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L509)

Get plugin context

#### Returns

[`IPluginContext`](../types/interfaces/IPluginContext.md)

***

### getPluginsDirectory()

> **getPluginsDirectory**(): `string`

Defined in: [src/plugin/manager/core.ts:502](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L502)

Get plugins directory

#### Returns

`string`

***

### gracefulShutdown()

> **gracefulShutdown**(): `Promise`\<`void`\>

Defined in: [src/plugin/manager/core.ts:517](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L517)

Gracefully shutdown plugin system without triggering deactivation or schema updates
This is used during server shutdown to avoid unnecessary operations

#### Returns

`Promise`\<`void`\>

***

### installPlugin()

> **installPlugin**(`pluginId`): `Promise`\<`boolean`\>

Defined in: [src/plugin/manager/core.ts:315](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L315)

Install a plugin

#### Parameters

##### pluginId

`string`

#### Returns

`Promise`\<`boolean`\>

***

### isPluginActive()

> **isPluginActive**(`pluginId`): `boolean`

Defined in: [src/plugin/manager/core.ts:428](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L428)

Check if plugin is active

#### Parameters

##### pluginId

`string`

#### Returns

`boolean`

***

### isPluginLoaded()

> **isPluginLoaded**(`pluginId`): `boolean`

Defined in: [src/plugin/manager/core.ts:421](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L421)

Check if plugin is loaded

#### Parameters

##### pluginId

`string`

#### Returns

`boolean`

***

### isSystemInitialized()

> **isSystemInitialized**(): `boolean`

Defined in: [src/plugin/manager/core.ts:495](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L495)

Check if system is initialized

#### Returns

`boolean`

***

### loadPlugin()

> **loadPlugin**(`pluginId`): `Promise`\<`boolean`\>

Defined in: [src/plugin/manager/core.ts:183](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L183)

Load a specific plugin

#### Parameters

##### pluginId

`string`

#### Returns

`Promise`\<`boolean`\>

***

### uninstallPlugin()

> **uninstallPlugin**(`pluginId`): `Promise`\<`boolean`\>

Defined in: [src/plugin/manager/core.ts:339](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L339)

Uninstall a plugin

#### Parameters

##### pluginId

`string`

#### Returns

`Promise`\<`boolean`\>

***

### unloadPlugin()

> **unloadPlugin**(`pluginId`): `Promise`\<`boolean`\>

Defined in: [src/plugin/manager/core.ts:346](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L346)

Unload a plugin from memory

#### Parameters

##### pluginId

`string`

#### Returns

`Promise`\<`boolean`\>
