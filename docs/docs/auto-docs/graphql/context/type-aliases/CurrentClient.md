[API Docs](/)

***

# Type Alias: CurrentClient

> **CurrentClient** = `object` & `{ [K in keyof ExplicitAuthenticationTokenPayload]?: never }` \| `object` & [`ExplicitAuthenticationTokenPayload`](ExplicitAuthenticationTokenPayload.md)

Defined in: [src/graphql/context.ts:24](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/context.ts#L24)

Type of the client-specific context for a grahphql operation client.
