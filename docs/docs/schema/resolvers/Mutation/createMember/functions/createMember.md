[**talawa-api**](../../../../README.md)

***

# Function: createMember()

> **createMember**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`CreateMemberPayload`](../../../../types/generatedGraphQLTypes/type-aliases/CreateMemberPayload.md), `"organization"` \| `"userErrors"`\> & `object`\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`CreateMemberPayload`](../../../../types/generatedGraphQLTypes/type-aliases/CreateMemberPayload.md), `"organization"` \| `"userErrors"`\> & `object`\>\>

Adds a user as a member to an organization.

This resolver performs the following actions:

1. Verifies if the current user making the request exists and is either a superAdmin or an admin of the organization.
2. Checks if the specified organization exists in the cache; if not, fetches it from the database and caches it.
3. Checks if the specified user exists and is not already a member of the organization.
4. Adds the user to the organization's member list and updates the user's joinedOrganizations list.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`MutationCreateMemberArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationCreateMemberArgs.md), `"input"`\>

The input arguments for the mutation, including:
  - `input`: An object containing:
    - `organizationId`: The ID of the organization to which the user will be added.
    - `userId`: The ID of the user to be added as a member.

### context

`any`

The context object containing user information (context.userId).

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`CreateMemberPayload`](../../../../types/generatedGraphQLTypes/type-aliases/CreateMemberPayload.md), `"organization"` \| `"userErrors"`\> & `object`\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`CreateMemberPayload`](../../../../types/generatedGraphQLTypes/type-aliases/CreateMemberPayload.md), `"organization"` \| `"userErrors"`\> & `object`\>\>

An object containing:
  - `organization`: The updated organization object.
  - `userErrors`: A list of errors encountered during the process.

## Remarks

This function returns the updated organization and any errors encountered. It ensures that the user is not already a member before adding them and handles caching of the organization.

## Defined in

[src/resolvers/Mutation/createMember.ts:47](https://github.com/Suyash878/talawa-api/blob/f376d03c37e9acd046e7cc983947432c95f74442/src/resolvers/Mutation/createMember.ts#L47)
