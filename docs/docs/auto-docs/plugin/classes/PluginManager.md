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

Defined in: [src/plugin/manager/core.ts:330](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L330)

Activate a plugin

#### Parameters

##### pluginId

`string`

#### Returns

`Promise`\<`boolean`\>

***

### clearErrors()

> **clearErrors**(): `void`

Defined in: [src/plugin/manager/core.ts:499](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L499)

Clear plugin errors

#### Returns

`void`

***

### deactivatePlugin()

> **deactivatePlugin**(`pluginId`, `dropTables`): `Promise`\<`boolean`\>

Defined in: [src/plugin/manager/core.ts:337](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L337)

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

Defined in: [src/plugin/manager/core.ts:472](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L472)

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

Defined in: [src/plugin/manager/core.ts:451](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L451)

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

Defined in: [src/plugin/manager/core.ts:413](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L413)

Get active plugins

#### Returns

[`ILoadedPlugin`](../types/interfaces/ILoadedPlugin.md)[]

***

### getErrors()

> **getErrors**(): [`IPluginError`](../types/interfaces/IPluginError.md)[]

Defined in: [src/plugin/manager/core.ts:492](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L492)

Get plugin errors

#### Returns

[`IPluginError`](../types/interfaces/IPluginError.md)[]

***

### getExtensionRegistry()

> **getExtensionRegistry**(): [`IExtensionRegistry`](../types/interfaces/IExtensionRegistry.md)

Defined in: [src/plugin/manager/core.ts:444](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L444)

Get extension registry

#### Returns

[`IExtensionRegistry`](../types/interfaces/IExtensionRegistry.md)

***

### getLoadedPluginIds()

> **getLoadedPluginIds**(): `string`[]

Defined in: [src/plugin/manager/core.ts:406](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L406)

Get loaded plugin IDs

#### Returns

`string`[]

***

### getLoadedPlugins()

> **getLoadedPlugins**(): [`ILoadedPlugin`](../types/interfaces/ILoadedPlugin.md)[]

Defined in: [src/plugin/manager/core.ts:399](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L399)

Get all loaded plugins

#### Returns

[`ILoadedPlugin`](../types/interfaces/ILoadedPlugin.md)[]

***

### getPlugin()

> **getPlugin**(`pluginId`): [`ILoadedPlugin`](../types/interfaces/ILoadedPlugin.md) \| `undefined`

Defined in: [src/plugin/manager/core.ts:422](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L422)

Get a specific plugin

#### Parameters

##### pluginId

`string`

#### Returns

[`ILoadedPlugin`](../types/interfaces/ILoadedPlugin.md) \| `undefined`

***

### getPluginContext()

> **getPluginContext**(): [`IPluginContext`](../types/interfaces/IPluginContext.md)

Defined in: [src/plugin/manager/core.ts:520](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L520)

Get plugin context

#### Returns

[`IPluginContext`](../types/interfaces/IPluginContext.md)

***

### getPluginsDirectory()

> **getPluginsDirectory**(): `string`

Defined in: [src/plugin/manager/core.ts:513](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L513)

Get plugins directory

#### Returns

`string`

***

### gracefulShutdown()

> **gracefulShutdown**(): `Promise`\<`void`\>

Defined in: [src/plugin/manager/core.ts:528](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L528)

Gracefully shutdown plugin system without triggering deactivation or schema updates
This is used during server shutdown to avoid unnecessary operations

#### Returns

`Promise`\<`void`\>

***

### installPlugin()

> **installPlugin**(`pluginId`): `Promise`\<`boolean`\>

Defined in: [src/plugin/manager/core.ts:323](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L323)

Install a plugin

#### Parameters

##### pluginId

`string`

#### Returns

`Promise`\<`boolean`\>

***

### isPluginActive()

> **isPluginActive**(`pluginId`): `boolean`

Defined in: [src/plugin/manager/core.ts:436](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L436)

Check if plugin is active

#### Parameters

##### pluginId

`string`

#### Returns

`boolean`

***

### isPluginLoaded()

> **isPluginLoaded**(`pluginId`): `boolean`

Defined in: [src/plugin/manager/core.ts:429](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L429)

Check if plugin is loaded

#### Parameters

##### pluginId

`string`

#### Returns

`boolean`

***

### isSystemInitialized()

> **isSystemInitialized**(): `boolean`

Defined in: [src/plugin/manager/core.ts:506](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L506)

Check if system is initialized

#### Returns

`boolean`

***

### loadPlugin()

> **loadPlugin**(`pluginId`): `Promise`\<`boolean`\>

Defined in: [src/plugin/manager/core.ts:192](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L192)

Load a specific plugin

#### Parameters

##### pluginId

`string`

#### Returns

`Promise`\<`boolean`\>

***

### uninstallPlugin()

> **uninstallPlugin**(`pluginId`): `Promise`\<`boolean`\>

Defined in: [src/plugin/manager/core.ts:347](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L347)

Uninstall a plugin

#### Parameters

##### pluginId

`string`

#### Returns

`Promise`\<`boolean`\>

***

### unloadPlugin()

> **unloadPlugin**(`pluginId`): `Promise`\<`boolean`\>

Defined in: [src/plugin/manager/core.ts:354](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L354)

Unload a plugin from memory

#### Parameters

##### pluginId

`string`

#### Returns

`Promise`\<`boolean`\>
