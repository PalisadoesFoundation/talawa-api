[Admin Docs](/)

***

# Function: getPluginByIdResolver()

> **getPluginByIdResolver**(`_`, `args`, `ctx`): `Promise`\<`undefined` \| \{ `backup`: `boolean`; `createdAt`: `Date`; `id`: `string`; `isActivated`: `boolean`; `isInstalled`: `boolean`; `pluginId`: `string`; `updatedAt`: `null` \| `Date`; \}\>

Defined in: [src/graphql/types/Query/plugins.ts:16](https://github.com/Sourya07/talawa-api/blob/aac5f782223414da32542752c1be099f0b872196/src/graphql/types/Query/plugins.ts#L16)

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

`Promise`\<`undefined` \| \{ `backup`: `boolean`; `createdAt`: `Date`; `id`: `string`; `isActivated`: `boolean`; `isInstalled`: `boolean`; `pluginId`: `string`; `updatedAt`: `null` \| `Date`; \}\>
