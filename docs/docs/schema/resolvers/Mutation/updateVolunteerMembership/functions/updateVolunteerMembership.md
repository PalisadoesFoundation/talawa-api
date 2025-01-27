[**talawa-api**](../../../../README.md)

***

# Function: updateVolunteerMembership()

> **updateVolunteerMembership**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceVolunteerMembership`](../../../../models/VolunteerMembership/interfaces/InterfaceVolunteerMembership.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceVolunteerMembership`](../../../../models/VolunteerMembership/interfaces/InterfaceVolunteerMembership.md)\>\>

This function enables to update an Volunteer Membership

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`MutationUpdateVolunteerMembershipArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationUpdateVolunteerMembershipArgs.md), `"status"` \| `"id"`\>

payload provided with the request

### context

`any`

context of entire application

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceVolunteerMembership`](../../../../models/VolunteerMembership/interfaces/InterfaceVolunteerMembership.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceVolunteerMembership`](../../../../models/VolunteerMembership/interfaces/InterfaceVolunteerMembership.md)\>\>

## Remarks

The following checks are done:
1. Whether the user exists
2. Update the Volunteer Membership
3. update related fields of Volunteer Group & Volunteer

## Defined in

[src/resolvers/Mutation/updateVolunteerMembership.ts:72](https://github.com/Suyash878/talawa-api/blob/e4413cec641a837926071678fed3c7f67234e31e/src/resolvers/Mutation/updateVolunteerMembership.ts#L72)
