[**talawa-api**](../../../../README.md)

***

# Class: PluginRegistry

Defined in: [src/plugin/manager/registry.ts:13](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/plugin/manager/registry.ts#L13)

## Constructors

### Constructor

> **new PluginRegistry**(`pluginContext`): `PluginRegistry`

Defined in: [src/plugin/manager/registry.ts:14](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/plugin/manager/registry.ts#L14)

#### Parameters

##### pluginContext

[`IPluginContext`](../../../types/interfaces/IPluginContext.md)

#### Returns

`PluginRegistry`

## Methods

### getPluginFromDatabase()

> **getPluginFromDatabase**(`pluginId`): `Promise`\<\{ `backup`: `boolean`; `createdAt`: `Date`; `id`: `string`; `isActivated`: `boolean`; `isInstalled`: `boolean`; `pluginId`: `string`; `updatedAt`: `Date` \| `null`; \} \| `null`\>

Defined in: [src/plugin/manager/registry.ts:19](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/plugin/manager/registry.ts#L19)

Get plugin from database

#### Parameters

##### pluginId

`string`

#### Returns

`Promise`\<\{ `backup`: `boolean`; `createdAt`: `Date`; `id`: `string`; `isActivated`: `boolean`; `isInstalled`: `boolean`; `pluginId`: `string`; `updatedAt`: `Date` \| `null`; \} \| `null`\>

***

### updatePluginInDatabase()

> **updatePluginInDatabase**(`pluginId`, `updates`): `Promise`\<`void`\>

Defined in: [src/plugin/manager/registry.ts:43](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/plugin/manager/registry.ts#L43)

Update plugin in database

#### Parameters

##### pluginId

`string`

##### updates

`Partial`\<*typeof* `pluginsTable.$inferInsert`\>

#### Returns

`Promise`\<`void`\>
