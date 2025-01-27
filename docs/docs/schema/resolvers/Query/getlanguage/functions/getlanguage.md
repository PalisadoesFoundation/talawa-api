[**talawa-api**](../../../../README.md)

***

# Function: getlanguage()

> **getlanguage**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Translation`](../../../../types/generatedGraphQLTypes/type-aliases/Translation.md)\>[] \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Translation`](../../../../types/generatedGraphQLTypes/type-aliases/Translation.md)\>[]\>

This query fetch a language for specified `lang_code` from the database.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`QueryGetlanguageArgs`](../../../../types/generatedGraphQLTypes/type-aliases/QueryGetlanguageArgs.md), `"lang_code"`\>

An object that contains `lang_code`.

### context

`any`

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Translation`](../../../../types/generatedGraphQLTypes/type-aliases/Translation.md)\>[] \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Translation`](../../../../types/generatedGraphQLTypes/type-aliases/Translation.md)\>[]\>

An object `filteredLanguages`.

## Defined in

[src/resolvers/Query/getlanguage.ts:12](https://github.com/Suyash878/talawa-api/blob/e4413cec641a837926071678fed3c7f67234e31e/src/resolvers/Query/getlanguage.ts#L12)
