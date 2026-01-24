[API Docs](/)

***

# Class: PluginManager

Defined in: src/plugin/manager/core.ts:32

Plugin System Main Entry Point for Talawa API

This file exports all the main plugin system components and utilities
for use throughout the API application.

## Extends

- `EventEmitter`

## Constructors

### Constructor

> **new PluginManager**(`context`, `pluginsDir?`): `PluginManager`

Defined in: src/plugin/manager/core.ts:62

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

Defined in: src/plugin/manager/core.ts:329

Activate a plugin

#### Parameters

##### pluginId

`string`

#### Returns

`Promise`\<`boolean`\>

***

### clearErrors()

> **clearErrors**(): `void`

Defined in: src/plugin/manager/core.ts:498

Clear plugin errors

#### Returns

`void`

***

### deactivatePlugin()

> **deactivatePlugin**(`pluginId`, `dropTables`): `Promise`\<`boolean`\>

Defined in: src/plugin/manager/core.ts:336

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

Defined in: src/plugin/manager/core.ts:471

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

Defined in: src/plugin/manager/core.ts:450

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

Defined in: src/plugin/manager/core.ts:412

Get active plugins

#### Returns

[`ILoadedPlugin`](../types/interfaces/ILoadedPlugin.md)[]

***

### getErrors()

> **getErrors**(): [`IPluginError`](../types/interfaces/IPluginError.md)[]

Defined in: src/plugin/manager/core.ts:491

Get plugin errors

#### Returns

[`IPluginError`](../types/interfaces/IPluginError.md)[]

***

### getExtensionRegistry()

> **getExtensionRegistry**(): [`IExtensionRegistry`](../types/interfaces/IExtensionRegistry.md)

Defined in: src/plugin/manager/core.ts:443

Get extension registry

#### Returns

[`IExtensionRegistry`](../types/interfaces/IExtensionRegistry.md)

***

### getLoadedPluginIds()

> **getLoadedPluginIds**(): `string`[]

Defined in: src/plugin/manager/core.ts:405

Get loaded plugin IDs

#### Returns

`string`[]

***

### getLoadedPlugins()

> **getLoadedPlugins**(): [`ILoadedPlugin`](../types/interfaces/ILoadedPlugin.md)[]

Defined in: src/plugin/manager/core.ts:398

Get all loaded plugins

#### Returns

[`ILoadedPlugin`](../types/interfaces/ILoadedPlugin.md)[]

***

### getPlugin()

> **getPlugin**(`pluginId`): [`ILoadedPlugin`](../types/interfaces/ILoadedPlugin.md) \| `undefined`

Defined in: src/plugin/manager/core.ts:421

Get a specific plugin

#### Parameters

##### pluginId

`string`

#### Returns

[`ILoadedPlugin`](../types/interfaces/ILoadedPlugin.md) \| `undefined`

***

### getPluginContext()

> **getPluginContext**(): [`IPluginContext`](../types/interfaces/IPluginContext.md)

Defined in: src/plugin/manager/core.ts:526

Get plugin context

#### Returns

[`IPluginContext`](../types/interfaces/IPluginContext.md)

***

### getPluginsDirectory()

> **getPluginsDirectory**(): `string`

Defined in: src/plugin/manager/core.ts:519

Get plugins directory

#### Returns

`string`

***

### gracefulShutdown()

> **gracefulShutdown**(): `Promise`\<`void`\>

Defined in: src/plugin/manager/core.ts:534

Gracefully shutdown plugin system without triggering deactivation or schema updates
This is used during server shutdown to avoid unnecessary operations

#### Returns

`Promise`\<`void`\>

***

### hasInitializationBeenAttempted()

> **hasInitializationBeenAttempted**(): `boolean`

Defined in: src/plugin/manager/core.ts:512

Check if initialization was attempted (regardless of success/failure)

#### Returns

`boolean`

***

### initialize()

> **initialize**(): `Promise`\<`void`\>

Defined in: src/plugin/manager/core.ts:85

Initialize the plugin system

#### Returns

`Promise`\<`void`\>

***

### installPlugin()

> **installPlugin**(`pluginId`): `Promise`\<`boolean`\>

Defined in: src/plugin/manager/core.ts:322

Install a plugin

#### Parameters

##### pluginId

`string`

#### Returns

`Promise`\<`boolean`\>

***

### isPluginActive()

> **isPluginActive**(`pluginId`): `boolean`

Defined in: src/plugin/manager/core.ts:435

Check if plugin is active

#### Parameters

##### pluginId

`string`

#### Returns

`boolean`

***

### isPluginLoaded()

> **isPluginLoaded**(`pluginId`): `boolean`

Defined in: src/plugin/manager/core.ts:428

Check if plugin is loaded

#### Parameters

##### pluginId

`string`

#### Returns

`boolean`

***

### isSystemInitialized()

> **isSystemInitialized**(): `boolean`

Defined in: src/plugin/manager/core.ts:505

Check if system is initialized (successfully)

#### Returns

`boolean`

***

### loadPlugin()

> **loadPlugin**(`pluginId`): `Promise`\<`boolean`\>

Defined in: src/plugin/manager/core.ts:189

Load a specific plugin

#### Parameters

##### pluginId

`string`

#### Returns

`Promise`\<`boolean`\>

***

### uninstallPlugin()

> **uninstallPlugin**(`pluginId`): `Promise`\<`boolean`\>

Defined in: src/plugin/manager/core.ts:346

Uninstall a plugin

#### Parameters

##### pluginId

`string`

#### Returns

`Promise`\<`boolean`\>

***

### unloadPlugin()

> **unloadPlugin**(`pluginId`): `Promise`\<`boolean`\>

Defined in: src/plugin/manager/core.ts:353

Unload a plugin from memory

#### Parameters

##### pluginId

`string`

#### Returns

`Promise`\<`boolean`\>
