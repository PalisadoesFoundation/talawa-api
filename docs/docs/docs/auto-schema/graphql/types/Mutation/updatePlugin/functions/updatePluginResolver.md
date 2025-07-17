[Admin Docs](/)

***

# Function: updatePluginResolver()

> **updatePluginResolver**(`_`, `args`, `ctx`): `Promise`\<\{ `backup`: `boolean`; `createdAt`: `Date`; `id`: `string`; `isActivated`: `boolean`; `isInstalled`: `boolean`; `pluginId`: `string`; `updatedAt`: `Date`; \}\>

Defined in: [src/graphql/types/Mutation/updatePlugin.ts:13](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/graphql/types/Mutation/updatePlugin.ts#L13)

Resolver for updatePlugin mutation

## Parameters

### \_

`unknown`

### args

#### input

\{ `backup?`: `boolean`; `id`: `string`; `isActivated?`: `boolean`; `isInstalled?`: `boolean`; `pluginId?`: `string`; \}

#### input.backup?

`boolean`

#### input.id

`string`

#### input.isActivated?

`boolean`

#### input.isInstalled?

`boolean`

#### input.pluginId?

`string`

### ctx

[`GraphQLContext`](../../../../context/type-aliases/GraphQLContext.md)

## Returns

`Promise`\<\{ `backup`: `boolean`; `createdAt`: `Date`; `id`: `string`; `isActivated`: `boolean`; `isInstalled`: `boolean`; `pluginId`: `string`; `updatedAt`: `Date`; \}\>
