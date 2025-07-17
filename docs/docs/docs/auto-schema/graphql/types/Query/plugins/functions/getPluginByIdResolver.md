[Admin Docs](/)

***

# Function: getPluginByIdResolver()

> **getPluginByIdResolver**(`_`, `args`, `ctx`): `Promise`\<\{ `backup`: `boolean`; `createdAt`: `Date`; `id`: `string`; `isActivated`: `boolean`; `isInstalled`: `boolean`; `pluginId`: `string`; `updatedAt`: `Date`; \}\>

Defined in: [src/graphql/types/Query/plugins.ts:16](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/graphql/types/Query/plugins.ts#L16)

Resolver for getPluginById

## Parameters

### \_

`unknown`

### args

#### input

\{ `id`: `string`; \}

#### input.id

`string`

### ctx

[`GraphQLContext`](../../../../context/type-aliases/GraphQLContext.md)

## Returns

`Promise`\<\{ `backup`: `boolean`; `createdAt`: `Date`; `id`: `string`; `isActivated`: `boolean`; `isInstalled`: `boolean`; `pluginId`: `string`; `updatedAt`: `Date`; \}\>
