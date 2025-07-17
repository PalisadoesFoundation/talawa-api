[Admin Docs](/)

***

# Class: PluginManager

Defined in: [src/plugin/manager.ts:35](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/plugin/manager.ts#L35)

## Extends

- `EventEmitter`

## Constructors

### Constructor

> **new PluginManager**(`context`, `pluginsDir?`): `PluginManager`

Defined in: [src/plugin/manager.ts:59](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/plugin/manager.ts#L59)

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

Defined in: [src/plugin/manager.ts:774](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/plugin/manager.ts#L774)

Activate a plugin

#### Parameters

##### pluginId

`string`

#### Returns

`Promise`\<`boolean`\>

***

### clearErrors()

> **clearErrors**(): `void`

Defined in: [src/plugin/manager.ts:1158](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/plugin/manager.ts#L1158)

Clear plugin errors

#### Returns

`void`

***

### deactivatePlugin()

> **deactivatePlugin**(`pluginId`, `dropTables`): `Promise`\<`boolean`\>

Defined in: [src/plugin/manager.ts:852](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/plugin/manager.ts#L852)

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

Defined in: [src/plugin/manager.ts:1134](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/plugin/manager.ts#L1134)

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

Defined in: [src/plugin/manager.ts:1116](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/plugin/manager.ts#L1116)

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

Defined in: [src/plugin/manager.ts:1078](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/plugin/manager.ts#L1078)

Get active plugins

#### Returns

[`ILoadedPlugin`](../types/interfaces/ILoadedPlugin.md)[]

***

### getErrors()

> **getErrors**(): [`IPluginError`](../types/interfaces/IPluginError.md)[]

Defined in: [src/plugin/manager.ts:1151](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/plugin/manager.ts#L1151)

Get plugin errors

#### Returns

[`IPluginError`](../types/interfaces/IPluginError.md)[]

***

### getExtensionRegistry()

> **getExtensionRegistry**(): [`IExtensionRegistry`](../types/interfaces/IExtensionRegistry.md)

Defined in: [src/plugin/manager.ts:1109](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/plugin/manager.ts#L1109)

Get extension registry

#### Returns

[`IExtensionRegistry`](../types/interfaces/IExtensionRegistry.md)

***

### getLoadedPluginIds()

> **getLoadedPluginIds**(): `string`[]

Defined in: [src/plugin/manager.ts:1071](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/plugin/manager.ts#L1071)

Get loaded plugin IDs

#### Returns

`string`[]

***

### getLoadedPlugins()

> **getLoadedPlugins**(): [`ILoadedPlugin`](../types/interfaces/ILoadedPlugin.md)[]

Defined in: [src/plugin/manager.ts:1064](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/plugin/manager.ts#L1064)

Get all loaded plugins

#### Returns

[`ILoadedPlugin`](../types/interfaces/ILoadedPlugin.md)[]

***

### getPlugin()

> **getPlugin**(`pluginId`): [`ILoadedPlugin`](../types/interfaces/ILoadedPlugin.md)

Defined in: [src/plugin/manager.ts:1087](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/plugin/manager.ts#L1087)

Get a specific plugin

#### Parameters

##### pluginId

`string`

#### Returns

[`ILoadedPlugin`](../types/interfaces/ILoadedPlugin.md)

***

### isPluginActive()

> **isPluginActive**(`pluginId`): `boolean`

Defined in: [src/plugin/manager.ts:1101](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/plugin/manager.ts#L1101)

Check if plugin is active

#### Parameters

##### pluginId

`string`

#### Returns

`boolean`

***

### isPluginLoaded()

> **isPluginLoaded**(`pluginId`): `boolean`

Defined in: [src/plugin/manager.ts:1094](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/plugin/manager.ts#L1094)

Check if plugin is loaded

#### Parameters

##### pluginId

`string`

#### Returns

`boolean`

***

### isSystemInitialized()

> **isSystemInitialized**(): `boolean`

Defined in: [src/plugin/manager.ts:1165](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/plugin/manager.ts#L1165)

Check if system is initialized

#### Returns

`boolean`

***

### loadPlugin()

> **loadPlugin**(`pluginId`): `Promise`\<`boolean`\>

Defined in: [src/plugin/manager.ts:199](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/plugin/manager.ts#L199)

Load a specific plugin

#### Parameters

##### pluginId

`string`

#### Returns

`Promise`\<`boolean`\>

***

### unloadPlugin()

> **unloadPlugin**(`pluginId`): `Promise`\<`boolean`\>

Defined in: [src/plugin/manager.ts:899](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/plugin/manager.ts#L899)

Unload a plugin

#### Parameters

##### pluginId

`string`

#### Returns

`Promise`\<`boolean`\>
