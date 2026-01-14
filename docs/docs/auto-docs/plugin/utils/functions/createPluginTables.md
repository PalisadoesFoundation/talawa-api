[API Docs](/)

***

# Function: createPluginTables()

> **createPluginTables**(`db`, `pluginId`, `tableDefinitions`, `logger?`): `Promise`\<`void`\>

Defined in: [src/plugin/utils.ts:465](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/utils.ts#L465)

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

[`ILogger`](../../types/interfaces/ILogger.md)

## Returns

`Promise`\<`void`\>
