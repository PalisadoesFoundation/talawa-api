[**talawa-api**](../../../../README.md)

***

# Function: updateSessionTimeout()

> **updateSessionTimeout**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<`boolean`\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<`boolean`\>\>

This function updates the session timeout and can only be performed by superadmin users.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`MutationUpdateSessionTimeoutArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationUpdateSessionTimeoutArgs.md), `"timeout"`\>

payload provided with the request, including organizationId and timeout

### context

`any`

context of the entire application, containing user information

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<`boolean`\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<`boolean`\>\>

- A message true if the organization timeout is updated successfully

## Throws

- NotFoundError: If the user, appuserprofile or organization is not found

## Throws

- ValidationError: If the user is not an admin or superadmin, or if the timeout is outside the valid range

## Throws

- InternalServerError: If there is an error updating the organization timeout

## Defined in

[src/resolvers/Mutation/updateSessionTimeout.ts:28](https://github.com/Suyash878/talawa-api/blob/e4413cec641a837926071678fed3c7f67234e31e/src/resolvers/Mutation/updateSessionTimeout.ts#L28)
