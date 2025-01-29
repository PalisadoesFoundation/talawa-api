[Admin Docs](/)

***

# Function: otp()

> **otp**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`OtpData`](../../../../types/generatedGraphQLTypes/type-aliases/OtpData.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`OtpData`](../../../../types/generatedGraphQLTypes/type-aliases/OtpData.md)\>\>

This function generates otp.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`MutationOtpArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationOtpArgs.md), `"data"`\>

payload provided with the request

### context

`any`

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`OtpData`](../../../../types/generatedGraphQLTypes/type-aliases/OtpData.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`OtpData`](../../../../types/generatedGraphQLTypes/type-aliases/OtpData.md)\>\>

Email to the user with the otp.

## Remarks

The following checks are done:
1. If the user exists

## Defined in

[src/resolvers/Mutation/otp.ts:16](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/resolvers/Mutation/otp.ts#L16)
