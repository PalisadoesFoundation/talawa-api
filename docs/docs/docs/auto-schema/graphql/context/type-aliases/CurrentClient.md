[Admin Docs](/)

***

# Type Alias: CurrentClient

> **CurrentClient** = `object` & `{ [K in keyof ExplicitAuthenticationTokenPayload]?: never }` \| `object` & [`ExplicitAuthenticationTokenPayload`](ExplicitAuthenticationTokenPayload.md)

Defined in: [src/graphql/context.ts:22](https://github.com/PurnenduMIshra129th/talawa-api/blob/75f0e499b44e2c3bed70cf951ac8ac374317f43b/src/graphql/context.ts#L22)

Type of the client-specific context for a grahphql operation client.
