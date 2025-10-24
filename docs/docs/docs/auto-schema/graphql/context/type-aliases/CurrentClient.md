[Admin Docs](/)

***

# Type Alias: CurrentClient

> **CurrentClient** = `object` & `{ [K in keyof ExplicitAuthenticationTokenPayload]?: never }` \| `object` & [`ExplicitAuthenticationTokenPayload`](ExplicitAuthenticationTokenPayload.md)

Defined in: [src/graphql/context.ts:22](https://github.com/Sourya07/talawa-api/blob/3df16fa5fb47e8947dc575f048aef648ae9ebcf8/src/graphql/context.ts#L22)

Type of the client-specific context for a grahphql operation client.
