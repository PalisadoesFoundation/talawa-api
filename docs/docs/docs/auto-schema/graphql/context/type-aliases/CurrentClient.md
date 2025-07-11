[Admin Docs](/)

***

# Type Alias: CurrentClient

> **CurrentClient** = `object` & `{ [K in keyof ExplicitAuthenticationTokenPayload]?: never }` \| `object` & [`ExplicitAuthenticationTokenPayload`](ExplicitAuthenticationTokenPayload.md)

Defined in: [src/graphql/context.ts:22](https://github.com/gautam-divyanshu/talawa-api/blob/441b833d91882cfef7272c118419933afe47f7b6/src/graphql/context.ts#L22)

Type of the client-specific context for a grahphql operation client.
