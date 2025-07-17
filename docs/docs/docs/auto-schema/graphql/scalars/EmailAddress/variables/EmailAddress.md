[Admin Docs](/)

***

# Variable: EmailAddress

> `const` **EmailAddress**: `ScalarRef`\<`ExtendDefaultTypes`\<\{ `Context`: [`GraphQLContext`](../../../context/type-aliases/GraphQLContext.md); `Scalars`: [`CustomScalars`](../../type-aliases/CustomScalars.md); \}\>, `string`, `string`, `string`\>

Defined in: [src/graphql/scalars/EmailAddress.ts:9](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/graphql/scalars/EmailAddress.ts#L9)

A custom scalar type for validating email addresses according to RFC 5322.
This ensures that all email fields in the schema are properly validated.
More information at this link: [https://the-guild.dev/graphql/scalars/docs/scalars/email-address](https://the-guild.dev/graphql/scalars/docs/scalars/email-address)
