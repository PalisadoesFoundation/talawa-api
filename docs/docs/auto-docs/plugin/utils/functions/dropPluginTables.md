[API Docs](/)

***

# Function: dropPluginTables()

> **dropPluginTables**(`db`, `pluginId`, `tableDefinitions`, `logger?`): `Promise`\<`void`\>

Defined in: [src/plugin/utils.ts:509](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/plugin/utils.ts#L509)

Dynamically drops database tables for a plugin

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
