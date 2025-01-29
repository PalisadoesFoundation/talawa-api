[Admin Docs](/)

***

# Function: forgotPassword()

> **forgotPassword**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<`boolean`\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<`boolean`\>\>

This function enables a user to restore password.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`MutationForgotPasswordArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationForgotPasswordArgs.md), `"data"`\>

payload provided with the request

### context

`any`

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<`boolean`\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<`boolean`\>\>

True if the operation is successful.

## Remarks

The following tasks are done:
1. Extracts email and otp out of otpToken.
2. Compares otpToken and otp.
3. Checks whether otp is valid.
4. Updates password field for user's document with email === email.

## Defined in

[src/resolvers/Mutation/forgotPassword.ts:23](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/resolvers/Mutation/forgotPassword.ts#L23)
