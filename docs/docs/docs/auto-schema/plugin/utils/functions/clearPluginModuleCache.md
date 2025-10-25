[Admin Docs](/)

***

# Function: clearPluginModuleCache()

> **clearPluginModuleCache**(`pluginPath`, `cacheObj?`): `void`

Defined in: [src/plugin/utils.ts:596](https://github.com/Sourya07/talawa-api/blob/61a1911602b2f0aac7635e08ae2918f4f768e8ff/src/plugin/utils.ts#L596)

Clear module cache entries for a plugin to prevent memory leaks
Note: In ES modules, we cannot directly access the module cache like in CommonJS
This function is kept for compatibility but does not perform cache clearing in ES modules

## Parameters

### pluginPath

`string`

### cacheObj?

`Record`\<`string`, `unknown`\>

## Returns

`void`
