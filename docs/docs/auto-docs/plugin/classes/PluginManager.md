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

Defined in: [src/plugin/manager/core.ts:62](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L62)

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

Defined in: [src/plugin/manager/core.ts:327](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L327)

Activate a plugin

#### Parameters

##### pluginId

`string`

#### Returns

`Promise`\<`boolean`\>

***

### clearErrors()

> **clearErrors**(): `void`

Defined in: [src/plugin/manager/core.ts:496](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L496)

Clear plugin errors

#### Returns

`void`

***

### deactivatePlugin()

> **deactivatePlugin**(`pluginId`, `dropTables`): `Promise`\<`boolean`\>

Defined in: [src/plugin/manager/core.ts:334](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L334)

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

Defined in: [src/plugin/manager/core.ts:469](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L469)

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

Defined in: [src/plugin/manager/core.ts:448](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L448)

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

Defined in: [src/plugin/manager/core.ts:410](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L410)

Get active plugins

#### Returns

[`ILoadedPlugin`](../types/interfaces/ILoadedPlugin.md)[]

***

### getErrors()

> **getErrors**(): [`IPluginError`](../types/interfaces/IPluginError.md)[]

Defined in: [src/plugin/manager/core.ts:489](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L489)

Get plugin errors

#### Returns

[`IPluginError`](../types/interfaces/IPluginError.md)[]

***

### getExtensionRegistry()

> **getExtensionRegistry**(): [`IExtensionRegistry`](../types/interfaces/IExtensionRegistry.md)

Defined in: [src/plugin/manager/core.ts:441](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L441)

Get extension registry

#### Returns

[`IExtensionRegistry`](../types/interfaces/IExtensionRegistry.md)

***

### getLoadedPluginIds()

> **getLoadedPluginIds**(): `string`[]

Defined in: [src/plugin/manager/core.ts:403](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L403)

Get loaded plugin IDs

#### Returns

`string`[]

***

### getLoadedPlugins()

> **getLoadedPlugins**(): [`ILoadedPlugin`](../types/interfaces/ILoadedPlugin.md)[]

Defined in: [src/plugin/manager/core.ts:396](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L396)

Get all loaded plugins

#### Returns

[`ILoadedPlugin`](../types/interfaces/ILoadedPlugin.md)[]

***

### getPlugin()

> **getPlugin**(`pluginId`): [`ILoadedPlugin`](../types/interfaces/ILoadedPlugin.md) \| `undefined`

Defined in: [src/plugin/manager/core.ts:419](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L419)

Get a specific plugin

#### Parameters

##### pluginId

`string`

#### Returns

[`ILoadedPlugin`](../types/interfaces/ILoadedPlugin.md) \| `undefined`

***

### getPluginContext()

> **getPluginContext**(): [`IPluginContext`](../types/interfaces/IPluginContext.md)

Defined in: [src/plugin/manager/core.ts:524](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L524)

Get plugin context

#### Returns

[`IPluginContext`](../types/interfaces/IPluginContext.md)

***

### getPluginsDirectory()

> **getPluginsDirectory**(): `string`

Defined in: [src/plugin/manager/core.ts:517](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L517)

Get plugins directory

#### Returns

`string`

***

### gracefulShutdown()

> **gracefulShutdown**(): `Promise`\<`void`\>

Defined in: [src/plugin/manager/core.ts:532](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L532)

Gracefully shutdown plugin system without triggering deactivation or schema updates
This is used during server shutdown to avoid unnecessary operations

#### Returns

`Promise`\<`void`\>

***

### hasInitializationBeenAttempted()

> **hasInitializationBeenAttempted**(): `boolean`

Defined in: [src/plugin/manager/core.ts:510](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L510)

Check if initialization was attempted (regardless of success/failure)

#### Returns

`boolean`

***

### initialize()

> **initialize**(): `Promise`\<`void`\>

Defined in: [src/plugin/manager/core.ts:85](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L85)

Initialize the plugin system

#### Returns

`Promise`\<`void`\>

***

### installPlugin()

> **installPlugin**(`pluginId`): `Promise`\<`boolean`\>

Defined in: [src/plugin/manager/core.ts:320](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L320)

Install a plugin

#### Parameters

##### pluginId

`string`

#### Returns

`Promise`\<`boolean`\>

***

### isPluginActive()

> **isPluginActive**(`pluginId`): `boolean`

Defined in: [src/plugin/manager/core.ts:433](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L433)

Check if plugin is active

#### Parameters

##### pluginId

`string`

#### Returns

`boolean`

***

### isPluginLoaded()

> **isPluginLoaded**(`pluginId`): `boolean`

Defined in: [src/plugin/manager/core.ts:426](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L426)

Check if plugin is loaded

#### Parameters

##### pluginId

`string`

#### Returns

`boolean`

***

### isSystemInitialized()

> **isSystemInitialized**(): `boolean`

Defined in: [src/plugin/manager/core.ts:503](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L503)

Check if system is initialized (successfully)

#### Returns

`boolean`

***

### loadPlugin()

> **loadPlugin**(`pluginId`): `Promise`\<`boolean`\>

Defined in: [src/plugin/manager/core.ts:187](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L187)

Load a specific plugin

#### Parameters

##### pluginId

`string`

#### Returns

`Promise`\<`boolean`\>

***

### uninstallPlugin()

> **uninstallPlugin**(`pluginId`): `Promise`\<`boolean`\>

Defined in: [src/plugin/manager/core.ts:344](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L344)

Uninstall a plugin

#### Parameters

##### pluginId

`string`

#### Returns

`Promise`\<`boolean`\>

***

### unloadPlugin()

> **unloadPlugin**(`pluginId`): `Promise`\<`boolean`\>

Defined in: [src/plugin/manager/core.ts:351](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L351)

Unload a plugin from memory

#### Parameters

##### pluginId

`string`

#### Returns

`Promise`\<`boolean`\>
