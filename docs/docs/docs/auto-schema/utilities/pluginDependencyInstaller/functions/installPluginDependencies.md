[Admin Docs](/)

***

# Function: installPluginDependencies()

> **installPluginDependencies**(`pluginId`, `logger?`): `Promise`\<[`DependencyInstallationResult`](../interfaces/DependencyInstallationResult.md)\>

Defined in: [src/utilities/pluginDependencyInstaller.ts:27](https://github.com/Sourya07/talawa-api/blob/ead7a48e0174153214ee7311f8b242ee1c1a12ca/src/utilities/pluginDependencyInstaller.ts#L27)

Install dependencies for a plugin using pnpm

## Parameters

### pluginId

`string`

The ID of the plugin

### logger?

Optional logger for output

#### error?

(`message`) => `void`

#### info?

(`message`) => `void`

## Returns

`Promise`\<[`DependencyInstallationResult`](../interfaces/DependencyInstallationResult.md)\>

Promise<DependencyInstallationResult>
