[**talawa-api**](../../../../README.md)

***

# Function: createVolunteerMembership()

> **createVolunteerMembership**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceVolunteerMembership`](../../../../models/VolunteerMembership/interfaces/InterfaceVolunteerMembership.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceVolunteerMembership`](../../../../models/VolunteerMembership/interfaces/InterfaceVolunteerMembership.md)\>\>

Creates a new event volunteer membership entry.

This function performs the following actions:
1. Validates the existence of the current user.
2. Checks if the specified user and event exist.
3. Creates a new volunteer entry for the event.
4. Creates a volunteer membership record for the new volunteer.
5. Returns the created vvolunteer membership record.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`MutationCreateVolunteerMembershipArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationCreateVolunteerMembershipArgs.md), `"data"`\>

The arguments for the mutation, including:
 - `data.userId`: The ID of the user to be assigned as a volunteer.
 - `data.event`: The ID of the event for which the volunteer is being created.
 - `data.group`: The ID of the volunteer group to which the user is being added.
 - `data.status`: The status of the volunteer membership.

### context

`any`

The context for the mutation, including:
  - `userId`: The ID of the current user performing the operation.

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceVolunteerMembership`](../../../../models/VolunteerMembership/interfaces/InterfaceVolunteerMembership.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceVolunteerMembership`](../../../../models/VolunteerMembership/interfaces/InterfaceVolunteerMembership.md)\>\>

The created event volunteer record.

## Defined in

[src/resolvers/Mutation/createVolunteerMembership.ts:31](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/resolvers/Mutation/createVolunteerMembership.ts#L31)
