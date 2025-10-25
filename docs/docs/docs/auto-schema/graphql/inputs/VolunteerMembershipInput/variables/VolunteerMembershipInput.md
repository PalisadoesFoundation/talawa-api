[Admin Docs](/)

***

# Variable: VolunteerMembershipInput

> `const` **VolunteerMembershipInput**: `InputObjectRef`\<`ExtendDefaultTypes`\<\{ `Context`: [`GraphQLContext`](../../../context/type-aliases/GraphQLContext.md); `Scalars`: [`CustomScalars`](../../../scalars/type-aliases/CustomScalars.md); \}\>, \{ `event`: `string`; `group?`: `null` \| `string`; `recurringEventInstanceId?`: `null` \| `string`; `scope?`: `null` \| `NonNullable`\<`undefined` \| `"ENTIRE_SERIES"` \| `"THIS_INSTANCE_ONLY"`\>; `status`: `NonNullable`\<`"rejected"` \| `"invited"` \| `"requested"` \| `"accepted"`\>; `userId`: `string`; \}\>

Defined in: [src/graphql/inputs/VolunteerMembershipInput.ts:33](https://github.com/Sourya07/talawa-api/blob/4e4298c85a0d2c28affa824f2aab7ec32b5f3ac5/src/graphql/inputs/VolunteerMembershipInput.ts#L33)

GraphQL input type for creating a VolunteerMembership.
Matches the old Talawa API VolunteerMembershipInput structure.
