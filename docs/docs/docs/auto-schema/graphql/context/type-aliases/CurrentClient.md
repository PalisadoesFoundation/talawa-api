[Admin Docs](/)

***

# Type Alias: CurrentClient

> **CurrentClient** = `object` & `{ [K in keyof ExplicitAuthenticationTokenPayload]?: never }` \| `object` & [`ExplicitAuthenticationTokenPayload`](ExplicitAuthenticationTokenPayload.md)

Defined in: [src/graphql/context.ts:22](https://github.com/PurnenduMIshra129th/talawa-api/blob/86f70716c91247c1756c784fed3bccb85b1ded8e/src/graphql/context.ts#L22)

Type of the client-specific context for a grahphql operation client.
