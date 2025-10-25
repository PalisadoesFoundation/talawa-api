[Admin Docs](/)

***

# Function: clearPluginModuleCache()

> **clearPluginModuleCache**(`pluginPath`, `cacheObj?`): `void`

Defined in: [src/plugin/utils.ts:596](https://github.com/Sourya07/talawa-api/blob/4e4298c85a0d2c28affa824f2aab7ec32b5f3ac5/src/plugin/utils.ts#L596)

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
