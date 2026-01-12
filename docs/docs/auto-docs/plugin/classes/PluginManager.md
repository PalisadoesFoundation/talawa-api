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

Defined in: [src/plugin/manager/core.ts:323](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L323)

Activate a plugin

#### Parameters

##### pluginId

`string`

#### Returns

`Promise`\<`boolean`\>

***

### clearErrors()

> **clearErrors**(): `void`

Defined in: [src/plugin/manager/core.ts:492](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L492)

Clear plugin errors

#### Returns

`void`

***

### deactivatePlugin()

> **deactivatePlugin**(`pluginId`, `dropTables`): `Promise`\<`boolean`\>

Defined in: [src/plugin/manager/core.ts:330](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L330)

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

Defined in: [src/plugin/manager/core.ts:465](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L465)

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

Defined in: [src/plugin/manager/core.ts:444](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L444)

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

Defined in: [src/plugin/manager/core.ts:406](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L406)

Get active plugins

#### Returns

[`ILoadedPlugin`](../types/interfaces/ILoadedPlugin.md)[]

***

### getErrors()

> **getErrors**(): [`IPluginError`](../types/interfaces/IPluginError.md)[]

Defined in: [src/plugin/manager/core.ts:485](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L485)

Get plugin errors

#### Returns

[`IPluginError`](../types/interfaces/IPluginError.md)[]

***

### getExtensionRegistry()

> **getExtensionRegistry**(): [`IExtensionRegistry`](../types/interfaces/IExtensionRegistry.md)

Defined in: [src/plugin/manager/core.ts:437](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L437)

Get extension registry

#### Returns

[`IExtensionRegistry`](../types/interfaces/IExtensionRegistry.md)

***

### getLoadedPluginIds()

> **getLoadedPluginIds**(): `string`[]

Defined in: [src/plugin/manager/core.ts:399](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L399)

Get loaded plugin IDs

#### Returns

`string`[]

***

### getLoadedPlugins()

> **getLoadedPlugins**(): [`ILoadedPlugin`](../types/interfaces/ILoadedPlugin.md)[]

Defined in: [src/plugin/manager/core.ts:392](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L392)

Get all loaded plugins

#### Returns

[`ILoadedPlugin`](../types/interfaces/ILoadedPlugin.md)[]

***

### getPlugin()

> **getPlugin**(`pluginId`): [`ILoadedPlugin`](../types/interfaces/ILoadedPlugin.md) \| `undefined`

Defined in: [src/plugin/manager/core.ts:415](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L415)

Get a specific plugin

#### Parameters

##### pluginId

`string`

#### Returns

[`ILoadedPlugin`](../types/interfaces/ILoadedPlugin.md) \| `undefined`

***

### getPluginContext()

> **getPluginContext**(): [`IPluginContext`](../types/interfaces/IPluginContext.md)

Defined in: [src/plugin/manager/core.ts:513](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L513)

Get plugin context

#### Returns

[`IPluginContext`](../types/interfaces/IPluginContext.md)

***

### getPluginsDirectory()

> **getPluginsDirectory**(): `string`

Defined in: [src/plugin/manager/core.ts:506](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L506)

Get plugins directory

#### Returns

`string`

***

### gracefulShutdown()

> **gracefulShutdown**(): `Promise`\<`void`\>

Defined in: [src/plugin/manager/core.ts:521](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L521)

Gracefully shutdown plugin system without triggering deactivation or schema updates
This is used during server shutdown to avoid unnecessary operations

#### Returns

`Promise`\<`void`\>

***

### initialize()

> **initialize**(): `Promise`\<`void`\>

Defined in: [src/plugin/manager/core.ts:84](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L84)

Initialize the plugin system

#### Returns

`Promise`\<`void`\>

***

### installPlugin()

> **installPlugin**(`pluginId`): `Promise`\<`boolean`\>

Defined in: [src/plugin/manager/core.ts:316](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L316)

Install a plugin

#### Parameters

##### pluginId

`string`

#### Returns

`Promise`\<`boolean`\>

***

### isPluginActive()

> **isPluginActive**(`pluginId`): `boolean`

Defined in: [src/plugin/manager/core.ts:429](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L429)

Check if plugin is active

#### Parameters

##### pluginId

`string`

#### Returns

`boolean`

***

### isPluginLoaded()

> **isPluginLoaded**(`pluginId`): `boolean`

Defined in: [src/plugin/manager/core.ts:422](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L422)

Check if plugin is loaded

#### Parameters

##### pluginId

`string`

#### Returns

`boolean`

***

### isSystemInitialized()

> **isSystemInitialized**(): `boolean`

Defined in: [src/plugin/manager/core.ts:499](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L499)

Check if system is initialized

#### Returns

`boolean`

***

### loadPlugin()

> **loadPlugin**(`pluginId`): `Promise`\<`boolean`\>

Defined in: [src/plugin/manager/core.ts:185](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L185)

Load a specific plugin

#### Parameters

##### pluginId

`string`

#### Returns

`Promise`\<`boolean`\>

***

### uninstallPlugin()

> **uninstallPlugin**(`pluginId`): `Promise`\<`boolean`\>

Defined in: [src/plugin/manager/core.ts:340](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L340)

Uninstall a plugin

#### Parameters

##### pluginId

`string`

#### Returns

`Promise`\<`boolean`\>

***

### unloadPlugin()

> **unloadPlugin**(`pluginId`): `Promise`\<`boolean`\>

Defined in: [src/plugin/manager/core.ts:347](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/manager/core.ts#L347)

Unload a plugin from memory

#### Parameters

##### pluginId

`string`

#### Returns

`Promise`\<`boolean`\>
