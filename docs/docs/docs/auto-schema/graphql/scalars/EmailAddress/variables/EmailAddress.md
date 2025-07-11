[Admin Docs](/)

***

# Variable: EmailAddress

> `const` **EmailAddress**: `ScalarRef`\<`ExtendDefaultTypes`\<\{ `Context`: [`GraphQLContext`](../../../context/type-aliases/GraphQLContext.md); `Scalars`: [`CustomScalars`](../../type-aliases/CustomScalars.md); \}\>, `string`, `string`, `string`\>

Defined in: [src/graphql/scalars/EmailAddress.ts:9](https://github.com/gautam-divyanshu/talawa-api/blob/a895c36f24acf725ac16aa7e0f8e50ef9fa64c42/src/graphql/scalars/EmailAddress.ts#L9)

A custom scalar type for validating email addresses according to RFC 5322.
This ensures that all email fields in the schema are properly validated.
More information at this link: [https://the-guild.dev/graphql/scalars/docs/scalars/email-address](https://the-guild.dev/graphql/scalars/docs/scalars/email-address)
