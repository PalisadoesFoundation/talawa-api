[Admin Docs](/)

***

# Function: createPluginTables()

> **createPluginTables**(`db`, `pluginId`, `tableDefinitions`, `logger?`): `Promise`\<`void`\>

Defined in: [src/plugin/utils.ts:455](https://github.com/Sourya07/talawa-api/blob/61a1911602b2f0aac7635e08ae2918f4f768e8ff/src/plugin/utils.ts#L455)

Dynamically creates database tables from plugin table definitions

## Parameters

### db

#### execute

(`sql`) => `Promise`\<`unknown`\>

### pluginId

`string`

### tableDefinitions

`Record`\<`string`, `Record`\<`string`, `unknown`\>\>

### logger?

#### info?

(`message`) => `void`

## Returns

`Promise`\<`void`\>
