[API Docs](/)

***

# Interface: IExtensionRegistry

Defined in: src/plugin/types.ts:92

## Properties

### database

> **database**: `object`

Defined in: src/plugin/types.ts:97

#### enums

> **enums**: `Record`\<`string`, `unknown`\>

#### relations

> **relations**: `Record`\<`string`, `unknown`\>

#### tables

> **tables**: `Record`\<`string`, `unknown`\>

***

### graphql

> **graphql**: `object`

Defined in: src/plugin/types.ts:93

#### builderExtensions

> **builderExtensions**: [`IGraphQLBuilderExtension`](IGraphQLBuilderExtension.md)[]

***

### hooks

> **hooks**: `object`

Defined in: src/plugin/types.ts:102

#### post

> **post**: `Record`\<`string`, (...`args`) => `unknown`[]\>

#### pre

> **pre**: `Record`\<`string`, (...`args`) => `unknown`[]\>

***

### webhooks

> **webhooks**: `object`

Defined in: src/plugin/types.ts:106

#### handlers

> **handlers**: `Record`\<`string`, (`request`, `reply`) => `Promise`\<`unknown`\>\>
