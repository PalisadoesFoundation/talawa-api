[Admin Docs](/)

***

# Variable: EmailAddress

> `const` **EmailAddress**: `ScalarRef`\<`ExtendDefaultTypes`\<\{ `Context`: [`GraphQLContext`](../../../context/type-aliases/GraphQLContext.md); `Scalars`: [`CustomScalars`](../../type-aliases/CustomScalars.md); \}\>, `string`, `string`, `string`\>

Defined in: [src/graphql/scalars/EmailAddress.ts:9](https://github.com/syedali237/talawa-api/blob/2d0d513d5268a339b8dac6b4711f8e71e79fc0e4/src/graphql/scalars/EmailAddress.ts#L9)

A custom scalar type for validating email addresses according to RFC 5322.
This ensures that all email fields in the schema are properly validated.
More information at this link: [https://the-guild.dev/graphql/scalars/docs/scalars/email-address](https://the-guild.dev/graphql/scalars/docs/scalars/email-address)
