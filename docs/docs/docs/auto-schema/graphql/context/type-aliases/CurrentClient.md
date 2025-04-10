[Admin Docs](/)

***

# Type Alias: CurrentClient

> **CurrentClient** = `object` & `{ [K in keyof ExplicitAuthenticationTokenPayload]?: never }` \| `object` & [`ExplicitAuthenticationTokenPayload`](ExplicitAuthenticationTokenPayload.md)

Defined in: [src/graphql/context.ts:22](https://github.com/PurnenduMIshra129th/talawa-api/blob/6dd1cb0af1891b88aa61534ec8a6180536cd264f/src/graphql/context.ts#L22)

Type of the client-specific context for a grahphql operation client.
