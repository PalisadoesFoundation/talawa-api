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

[src/resolvers/Query/getlanguage.ts:12](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/resolvers/Query/getlanguage.ts#L12)
