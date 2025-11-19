[API Docs](/)

***

# Interface: ILoadedPlugin

Defined in: src/plugin/types.ts:69

## Properties

### databaseTables

> **databaseTables**: `Record`\<`string`, `Record`\<`string`, `unknown`\>\>

Defined in: src/plugin/types.ts:73

***

### errorMessage?

> `optional` **errorMessage**: `string`

Defined in: src/plugin/types.ts:80

***

### graphqlResolvers

> **graphqlResolvers**: `Record`\<`string`, `unknown`\>

Defined in: src/plugin/types.ts:72

***

### hooks

> **hooks**: `Record`\<`string`, (...`args`) => `unknown`\>

Defined in: src/plugin/types.ts:74

***

### id

> **id**: `string`

Defined in: src/plugin/types.ts:70

***

### manifest

> **manifest**: [`IPluginManifest`](IPluginManifest.md)

Defined in: src/plugin/types.ts:71

***

### status

> **status**: [`PluginStatus`](../enumerations/PluginStatus.md)

Defined in: src/plugin/types.ts:79

***

### webhooks

> **webhooks**: `Record`\<`string`, (`request`, `reply`) => `Promise`\<`unknown`\>\>

Defined in: src/plugin/types.ts:75
