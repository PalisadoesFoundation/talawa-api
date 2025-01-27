[**talawa-api**](../../../../README.md)

***

# Function: updateLanguage()

> **updateLanguage**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceUser`](../../../../models/User/interfaces/InterfaceUser.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceUser`](../../../../models/User/interfaces/InterfaceUser.md)\>\>

This function enables to update language.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`MutationUpdateLanguageArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationUpdateLanguageArgs.md), `"languageCode"`\>

payload provided with the request

### context

`any`

context of entire application

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceUser`](../../../../models/User/interfaces/InterfaceUser.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceUser`](../../../../models/User/interfaces/InterfaceUser.md)\>\>

Updated language.

## Remarks

The following checks are done:
1. If the user exists.

## Defined in

[src/resolvers/Mutation/updateLanguage.ts:13](https://github.com/Suyash878/talawa-api/blob/e4413cec641a837926071678fed3c7f67234e31e/src/resolvers/Mutation/updateLanguage.ts#L13)
