[Admin Docs](/)

***

# Class: PluginRegistry

Defined in: [src/plugin/manager/registry.ts:13](https://github.com/Sourya07/talawa-api/blob/583d62db9438de398bb9012a4a2617e2cb268b08/src/plugin/manager/registry.ts#L13)

## Constructors

### Constructor

> **new PluginRegistry**(`pluginContext`): `PluginRegistry`

Defined in: [src/plugin/manager/registry.ts:14](https://github.com/Sourya07/talawa-api/blob/583d62db9438de398bb9012a4a2617e2cb268b08/src/plugin/manager/registry.ts#L14)

#### Parameters

##### pluginContext

[`IPluginContext`](../../../types/interfaces/IPluginContext.md)

#### Returns

`PluginRegistry`

## Methods

### getPluginFromDatabase()

> **getPluginFromDatabase**(`pluginId`): `Promise`\<`null` \| \{ `backup`: `boolean`; `createdAt`: `Date`; `id`: `string`; `isActivated`: `boolean`; `isInstalled`: `boolean`; `pluginId`: `string`; `updatedAt`: `null` \| `Date`; \}\>

Defined in: [src/plugin/manager/registry.ts:19](https://github.com/Sourya07/talawa-api/blob/583d62db9438de398bb9012a4a2617e2cb268b08/src/plugin/manager/registry.ts#L19)

Get plugin from database

#### Parameters

##### pluginId

`string`

#### Returns

`Promise`\<`null` \| \{ `backup`: `boolean`; `createdAt`: `Date`; `id`: `string`; `isActivated`: `boolean`; `isInstalled`: `boolean`; `pluginId`: `string`; `updatedAt`: `null` \| `Date`; \}\>

***

### updatePluginInDatabase()

> **updatePluginInDatabase**(`pluginId`, `updates`): `Promise`\<`void`\>

Defined in: [src/plugin/manager/registry.ts:40](https://github.com/Sourya07/talawa-api/blob/583d62db9438de398bb9012a4a2617e2cb268b08/src/plugin/manager/registry.ts#L40)

Update plugin in database

#### Parameters

##### pluginId

`string`

##### updates

`Partial`\<*typeof* `pluginsTable.$inferInsert`\>

#### Returns

`Promise`\<`void`\>
