[Admin Docs](/)

***

# Variable: EventVolunteerInput

> `const` **EventVolunteerInput**: `InputObjectRef`\<`ExtendDefaultTypes`\<\{ `Context`: [`GraphQLContext`](../../../context/type-aliases/GraphQLContext.md); `Scalars`: [`CustomScalars`](../../../scalars/type-aliases/CustomScalars.md); \}\>, \{ `eventId`: `string`; `groupId?`: `null` \| `string`; `recurringEventInstanceId?`: `null` \| `string`; `scope?`: `null` \| `NonNullable`\<`undefined` \| `"ENTIRE_SERIES"` \| `"THIS_INSTANCE_ONLY"`\>; `userId`: `string`; \}\>

Defined in: [src/graphql/inputs/EventVolunteerInput.ts:32](https://github.com/Sourya07/talawa-api/blob/583d62db9438de398bb9012a4a2617e2cb268b08/src/graphql/inputs/EventVolunteerInput.ts#L32)

GraphQL input type for creating an EventVolunteer.
Matches the old Talawa API EventVolunteerInput structure.
