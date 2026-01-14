[**talawa-api**](../../../README.md)

***

# Interface: ILoadedPlugin

Defined in: [src/plugin/types.ts:69](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/plugin/types.ts#L69)

## Properties

### databaseTables

> **databaseTables**: `Record`\<`string`, `Record`\<`string`, `unknown`\>\>

Defined in: [src/plugin/types.ts:73](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/plugin/types.ts#L73)

***

### errorMessage?

> `optional` **errorMessage**: `string`

Defined in: [src/plugin/types.ts:80](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/plugin/types.ts#L80)

***

### graphqlResolvers

> **graphqlResolvers**: `Record`\<`string`, `unknown`\>

Defined in: [src/plugin/types.ts:72](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/plugin/types.ts#L72)

***

### hooks

> **hooks**: `Record`\<`string`, (...`args`) => `unknown`\>

Defined in: [src/plugin/types.ts:74](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/plugin/types.ts#L74)

***

### id

> **id**: `string`

Defined in: [src/plugin/types.ts:70](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/plugin/types.ts#L70)

***

### manifest

> **manifest**: [`IPluginManifest`](IPluginManifest.md)

Defined in: [src/plugin/types.ts:71](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/plugin/types.ts#L71)

***

### status

> **status**: [`PluginStatus`](../enumerations/PluginStatus.md)

Defined in: [src/plugin/types.ts:79](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/plugin/types.ts#L79)

***

### webhooks

> **webhooks**: `Record`\<`string`, (`request`, `reply`) => `Promise`\<`unknown`\>\>

Defined in: [src/plugin/types.ts:75](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/plugin/types.ts#L75)
