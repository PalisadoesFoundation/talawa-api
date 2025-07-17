[Admin Docs](/)

***

# Type Alias: CurrentClient

> **CurrentClient** = `object` & `{ [K in keyof ExplicitAuthenticationTokenPayload]?: never }` \| `object` & [`ExplicitAuthenticationTokenPayload`](ExplicitAuthenticationTokenPayload.md)

Defined in: [src/graphql/context.ts:22](https://github.com/gautam-divyanshu/talawa-api/blob/22f85ff86fcf5f38b53dcdb9fe90ab33ea32d944/src/graphql/context.ts#L22)

Type of the client-specific context for a grahphql operation client.
