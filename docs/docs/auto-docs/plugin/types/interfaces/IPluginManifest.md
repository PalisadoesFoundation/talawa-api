[**talawa-api**](../../../README.md)

***

# Interface: IPluginManifest

Defined in: [src/plugin/types.ts:6](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/plugin/types.ts#L6)

Centralized type definitions for the Talawa API plugin system

## Properties

### author

> **author**: `string`

Defined in: [src/plugin/types.ts:11](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/plugin/types.ts#L11)

***

### dependencies?

> `optional` **dependencies**: `Record`\<`string`, `string`\>

Defined in: [src/plugin/types.ts:18](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/plugin/types.ts#L18)

***

### description

> **description**: `string`

Defined in: [src/plugin/types.ts:10](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/plugin/types.ts#L10)

***

### docker?

> `optional` **docker**: `object`

Defined in: [src/plugin/types.ts:19](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/plugin/types.ts#L19)

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

Defined in: [src/plugin/types.ts:13](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/plugin/types.ts#L13)

***

### homepage?

> `optional` **homepage**: `string`

Defined in: [src/plugin/types.ts:15](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/plugin/types.ts#L15)

***

### icon?

> `optional` **icon**: `string`

Defined in: [src/plugin/types.ts:14](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/plugin/types.ts#L14)

***

### license?

> `optional` **license**: `string`

Defined in: [src/plugin/types.ts:16](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/plugin/types.ts#L16)

***

### main

> **main**: `string`

Defined in: [src/plugin/types.ts:12](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/plugin/types.ts#L12)

***

### name

> **name**: `string`

Defined in: [src/plugin/types.ts:7](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/plugin/types.ts#L7)

***

### pluginId

> **pluginId**: `string`

Defined in: [src/plugin/types.ts:8](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/plugin/types.ts#L8)

***

### tags?

> `optional` **tags**: `string`[]

Defined in: [src/plugin/types.ts:17](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/plugin/types.ts#L17)

***

### version

> **version**: `string`

Defined in: [src/plugin/types.ts:9](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/plugin/types.ts#L9)
