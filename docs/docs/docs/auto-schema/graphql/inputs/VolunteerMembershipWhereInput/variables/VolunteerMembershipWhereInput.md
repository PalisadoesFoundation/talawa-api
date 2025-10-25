[Admin Docs](/)

***

# Variable: VolunteerMembershipWhereInput

> `const` **VolunteerMembershipWhereInput**: `InputObjectRef`\<`ExtendDefaultTypes`\<\{ `Context`: [`GraphQLContext`](../../../context/type-aliases/GraphQLContext.md); `Scalars`: [`CustomScalars`](../../../scalars/type-aliases/CustomScalars.md); \}\>, \{ `eventId?`: `null` \| `string`; `eventTitle?`: `null` \| `string`; `filter?`: `null` \| `NonNullable`\<`undefined` \| `"group"` \| `"individual"`\>; `groupId?`: `null` \| `string`; `status?`: `null` \| `NonNullable`\<`undefined` \| `"rejected"` \| `"invited"` \| `"requested"` \| `"accepted"`\>; `userId?`: `null` \| `string`; `userName?`: `null` \| `string`; \}\>

Defined in: [src/graphql/inputs/VolunteerMembershipWhereInput.ts:24](https://github.com/Sourya07/talawa-api/blob/4e4298c85a0d2c28affa824f2aab7ec32b5f3ac5/src/graphql/inputs/VolunteerMembershipWhereInput.ts#L24)

GraphQL input type for filtering VolunteerMemberships.
Matches the old Talawa API VolunteerMembershipWhereInput structure.
