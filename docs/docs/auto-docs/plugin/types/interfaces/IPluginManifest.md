[**talawa-api**](../../../README.md)

***

# Interface: IPluginManifest

Defined in: src/plugin/types.ts:6

Centralized type definitions for the Talawa API plugin system

## Properties

### author

> **author**: `string`

Defined in: src/plugin/types.ts:11

***

### dependencies?

> `optional` **dependencies**: `Record`\<`string`, `string`\>

Defined in: src/plugin/types.ts:18

***

### description

> **description**: `string`

Defined in: src/plugin/types.ts:10

***

### docker?

> `optional` **docker**: `object`

Defined in: src/plugin/types.ts:19

#### buildOnInstall?

> `optional` **buildOnInstall**: `boolean`

#### composeFile?

> `optional` **composeFile**: `string`

#### downOnDeactivate?

> `optional` **downOnDeactivate**: `boolean`

#### enabled?

> `optional` **enabled**: `boolean`

#### env?

> `optional` **env**: `Record`\<`string`, `string`\>

#### removeOnUninstall?

> `optional` **removeOnUninstall**: `boolean`

#### service?

> `optional` **service**: `string`

#### upOnActivate?

> `optional` **upOnActivate**: `boolean`

***

### extensionPoints?

> `optional` **extensionPoints**: [`IExtensionPoints`](IExtensionPoints.md)

Defined in: src/plugin/types.ts:13

***

### homepage?

> `optional` **homepage**: `string`

Defined in: src/plugin/types.ts:15

***

### icon?

> `optional` **icon**: `string`

Defined in: src/plugin/types.ts:14

***

### license?

> `optional` **license**: `string`

Defined in: src/plugin/types.ts:16

***

### main

> **main**: `string`

Defined in: src/plugin/types.ts:12

***

### name

> **name**: `string`

Defined in: src/plugin/types.ts:7

***

### pluginId

> **pluginId**: `string`

Defined in: src/plugin/types.ts:8

***

### tags?

> `optional` **tags**: `string`[]

Defined in: src/plugin/types.ts:17

***

### version

> **version**: `string`

Defined in: src/plugin/types.ts:9
