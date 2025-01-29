[**talawa-api**](../../../../README.md)

***

# Function: userLanguage()

> **userLanguage**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<`string`\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<`string`\>\>

This query will fetch the language code for the user from the database.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`QueryUserLanguageArgs`](../../../../types/generatedGraphQLTypes/type-aliases/QueryUserLanguageArgs.md), `"userId"`\>

An object that contains `userId`.

### context

`any`

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<`string`\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<`string`\>\>

The language code of the user.

## Defined in

[src/resolvers/Query/userLanguage.ts:14](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/resolvers/Query/userLanguage.ts#L14)
