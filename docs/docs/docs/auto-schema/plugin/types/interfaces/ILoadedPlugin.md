[Admin Docs](/)

***

# Interface: ILoadedPlugin

Defined in: [src/plugin/types.ts:50](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/plugin/types.ts#L50)

## Properties

### databaseTables

> **databaseTables**: `Record`\<`string`, `Record`\<`string`, `unknown`\>\>

Defined in: [src/plugin/types.ts:54](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/plugin/types.ts#L54)

***

### errorMessage?

> `optional` **errorMessage**: `string`

Defined in: [src/plugin/types.ts:57](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/plugin/types.ts#L57)

***

### graphqlResolvers

> **graphqlResolvers**: `Record`\<`string`, `unknown`\>

Defined in: [src/plugin/types.ts:53](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/plugin/types.ts#L53)

***

### hooks

> **hooks**: `Record`\<`string`, (...`args`) => `unknown`\>

Defined in: [src/plugin/types.ts:55](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/plugin/types.ts#L55)

***

### id

> **id**: `string`

Defined in: [src/plugin/types.ts:51](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/plugin/types.ts#L51)

***

### manifest

> **manifest**: [`IPluginManifest`](IPluginManifest.md)

Defined in: [src/plugin/types.ts:52](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/plugin/types.ts#L52)

***

### status

> **status**: [`PluginStatus`](../enumerations/PluginStatus.md)

Defined in: [src/plugin/types.ts:56](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/plugin/types.ts#L56)
