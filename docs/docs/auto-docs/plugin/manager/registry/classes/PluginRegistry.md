[**talawa-api**](../../../../README.md)

***

# Class: PluginRegistry

Defined in: [src/plugin/manager/registry.ts:13](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/plugin/manager/registry.ts#L13)

## Constructors

### Constructor

> **new PluginRegistry**(`pluginContext`): `PluginRegistry`

Defined in: [src/plugin/manager/registry.ts:14](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/plugin/manager/registry.ts#L14)

#### Parameters

##### pluginContext

[`IPluginContext`](../../../types/interfaces/IPluginContext.md)

#### Returns

`PluginRegistry`

## Methods

### getPluginFromDatabase()

> **getPluginFromDatabase**(`pluginId`): `Promise`\<\{ `backup`: `boolean`; `createdAt`: `Date`; `id`: `string`; `isActivated`: `boolean`; `isInstalled`: `boolean`; `pluginId`: `string`; `updatedAt`: `Date` \| `null`; \} \| `null`\>

Defined in: [src/plugin/manager/registry.ts:19](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/plugin/manager/registry.ts#L19)

Get plugin from database

#### Parameters

##### pluginId

`string`

#### Returns

`Promise`\<\{ `backup`: `boolean`; `createdAt`: `Date`; `id`: `string`; `isActivated`: `boolean`; `isInstalled`: `boolean`; `pluginId`: `string`; `updatedAt`: `Date` \| `null`; \} \| `null`\>

***

### updatePluginInDatabase()

> **updatePluginInDatabase**(`pluginId`, `updates`): `Promise`\<`void`\>

Defined in: [src/plugin/manager/registry.ts:40](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/plugin/manager/registry.ts#L40)

Update plugin in database

#### Parameters

##### pluginId

`string`

##### updates

`Partial`\<*typeof* `pluginsTable.$inferInsert`\>

#### Returns

`Promise`\<`void`\>
