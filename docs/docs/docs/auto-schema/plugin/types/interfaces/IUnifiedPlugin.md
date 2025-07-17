[Admin Docs](/)

***

# Interface: IUnifiedPlugin

Defined in: [src/plugin/types.ts:137](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/plugin/types.ts#L137)

## Properties

### errorMessage?

> `optional` **errorMessage**: `string`

Defined in: [src/plugin/types.ts:141](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/plugin/types.ts#L141)

***

### extensions?

> `optional` **extensions**: `object`

Defined in: [src/plugin/types.ts:143](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/plugin/types.ts#L143)

#### admin?

> `optional` **admin**: `object`

##### admin.components?

> `optional` **components**: `Record`\<`string`, `unknown`\>

##### admin.drawer?

> `optional` **drawer**: [`IDrawerExtension`](IDrawerExtension.md)[]

##### admin.routes?

> `optional` **routes**: [`IRouteExtension`](IRouteExtension.md)[]

#### api?

> `optional` **api**: `object`

##### api.databaseTables?

> `optional` **databaseTables**: `Record`\<`string`, `unknown`\>

##### api.graphqlResolvers?

> `optional` **graphqlResolvers**: `Record`\<`string`, `unknown`\>

##### api.hooks?

> `optional` **hooks**: `Record`\<`string`, (...`args`) => `unknown`\>

***

### id

> **id**: `string`

Defined in: [src/plugin/types.ts:138](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/plugin/types.ts#L138)

***

### manifest

> **manifest**: [`IPluginManifest`](IPluginManifest.md)

Defined in: [src/plugin/types.ts:139](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/plugin/types.ts#L139)

***

### status

> **status**: [`PluginStatus`](../enumerations/PluginStatus.md)

Defined in: [src/plugin/types.ts:140](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/plugin/types.ts#L140)
