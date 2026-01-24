[**talawa-api**](../../../README.md)

***

# Function: installPluginDependencies()

> **installPluginDependencies**(`pluginId`, `logger?`): `Promise`\<[`DependencyInstallationResult`](../interfaces/DependencyInstallationResult.md)\>

Defined in: src/utilities/pluginDependencyInstaller.ts:26

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

- Promise<DependencyInstallationResult>
