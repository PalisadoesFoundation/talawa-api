[Admin Docs](/)

***

# Function: installPluginDependencies()

> **installPluginDependencies**(`pluginId`, `logger?`): `Promise`\<[`DependencyInstallationResult`](../interfaces/DependencyInstallationResult.md)\>

Defined in: [src/utilities/pluginDependencyInstaller.ts:27](https://github.com/Sourya07/talawa-api/blob/61a1911602b2f0aac7635e08ae2918f4f768e8ff/src/utilities/pluginDependencyInstaller.ts#L27)

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
