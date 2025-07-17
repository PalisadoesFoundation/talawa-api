[Admin Docs](/)

***

# Function: createPluginResolver()

> **createPluginResolver**(`_`, `args`, `ctx`): `Promise`\<\{ `backup`: `boolean`; `createdAt`: `Date`; `id`: `string`; `isActivated`: `boolean`; `isInstalled`: `boolean`; `pluginId`: `string`; `updatedAt`: `Date`; \}\>

Defined in: [src/graphql/types/Mutation/createPlugin.ts:20](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/graphql/types/Mutation/createPlugin.ts#L20)

Resolver for createPlugin mutation

## Parameters

### \_

`unknown`

### args

#### input

\{ `backup?`: `boolean`; `isActivated?`: `boolean`; `isInstalled?`: `boolean`; `pluginId`: `string`; \}

#### input.backup?

`boolean`

#### input.isActivated?

`boolean`

#### input.isInstalled?

`boolean`

#### input.pluginId

`string`

### ctx

[`GraphQLContext`](../../../../context/type-aliases/GraphQLContext.md)

## Returns

`Promise`\<\{ `backup`: `boolean`; `createdAt`: `Date`; `id`: `string`; `isActivated`: `boolean`; `isInstalled`: `boolean`; `pluginId`: `string`; `updatedAt`: `Date`; \}\>
