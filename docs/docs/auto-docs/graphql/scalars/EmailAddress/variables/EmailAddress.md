[**talawa-api**](../../../../README.md)

***

# Variable: EmailAddress

> `const` **EmailAddress**: `ScalarRef`\<`ExtendDefaultTypes`\<\{ `Context`: [`GraphQLContext`](../../../context/type-aliases/GraphQLContext.md); `Scalars`: [`CustomScalars`](../../type-aliases/CustomScalars.md); \}\>, `string`, `string`, `string`\>

Defined in: [src/graphql/scalars/EmailAddress.ts:9](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/graphql/scalars/EmailAddress.ts#L9)

A custom scalar type for validating email addresses according to RFC 5322.
This ensures that all email fields in the schema are properly validated.
More information at this link: [https://the-guild.dev/graphql/scalars/docs/scalars/email-address](https://the-guild.dev/graphql/scalars/docs/scalars/email-address)
