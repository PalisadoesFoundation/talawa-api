[**talawa-api**](../../../README.md)

***

# Interface: IExtensionRegistry

Defined in: [src/plugin/types.ts:92](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/plugin/types.ts#L92)

## Properties

### database

> **database**: `object`

Defined in: [src/plugin/types.ts:97](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/plugin/types.ts#L97)

#### enums

> **enums**: `Record`\<`string`, `unknown`\>

#### relations

> **relations**: `Record`\<`string`, `unknown`\>

#### tables

> **tables**: `Record`\<`string`, `unknown`\>

***

### graphql

> **graphql**: `object`

Defined in: [src/plugin/types.ts:93](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/plugin/types.ts#L93)

#### builderExtensions

> **builderExtensions**: [`IGraphQLBuilderExtension`](IGraphQLBuilderExtension.md)[]

***

### hooks

> **hooks**: `object`

Defined in: [src/plugin/types.ts:102](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/plugin/types.ts#L102)

#### post

> **post**: `Record`\<`string`, (...`args`) => `unknown`[]\>

#### pre

> **pre**: `Record`\<`string`, (...`args`) => `unknown`[]\>

***

### webhooks

> **webhooks**: `object`

Defined in: [src/plugin/types.ts:106](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/plugin/types.ts#L106)

#### handlers

> **handlers**: `Record`\<`string`, (`request`, `reply`) => `Promise`\<`unknown`\>\>
