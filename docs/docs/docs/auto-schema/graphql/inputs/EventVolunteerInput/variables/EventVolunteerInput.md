[Admin Docs](/)

***

# Variable: EventVolunteerInput

> `const` **EventVolunteerInput**: `InputObjectRef`\<`ExtendDefaultTypes`\<\{ `Context`: [`GraphQLContext`](../../../context/type-aliases/GraphQLContext.md); `Scalars`: [`CustomScalars`](../../../scalars/type-aliases/CustomScalars.md); \}\>, \{ `eventId`: `string`; `groupId?`: `null` \| `string`; `recurringEventInstanceId?`: `null` \| `string`; `scope?`: `null` \| `NonNullable`\<`undefined` \| `"ENTIRE_SERIES"` \| `"THIS_INSTANCE_ONLY"`\>; `userId`: `string`; \}\>

Defined in: [src/graphql/inputs/EventVolunteerInput.ts:32](https://github.com/Sourya07/talawa-api/blob/61a1911602b2f0aac7635e08ae2918f4f768e8ff/src/graphql/inputs/EventVolunteerInput.ts#L32)

GraphQL input type for creating an EventVolunteer.
Matches the old Talawa API EventVolunteerInput structure.
