[Admin Docs](/)

***

# Function: deleteDonationById()

> **deleteDonationById**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`DeletePayload`](../../../../types/generatedGraphQLTypes/type-aliases/DeletePayload.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`DeletePayload`](../../../../types/generatedGraphQLTypes/type-aliases/DeletePayload.md)\>\>

This function enables to delete a donation record from the database.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`MutationDeleteDonationByIdArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationDeleteDonationByIdArgs.md), `"id"`\>

payload provided with the request

### context

`any`

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`DeletePayload`](../../../../types/generatedGraphQLTypes/type-aliases/DeletePayload.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`DeletePayload`](../../../../types/generatedGraphQLTypes/type-aliases/DeletePayload.md)\>\>

Boolean value denoting whether the deletion was successful or not.

## Defined in

[src/resolvers/Mutation/deleteDonationById.ts:10](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/resolvers/Mutation/deleteDonationById.ts#L10)
