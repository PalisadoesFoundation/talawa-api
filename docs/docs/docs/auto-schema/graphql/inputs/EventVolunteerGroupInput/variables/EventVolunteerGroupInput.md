[Admin Docs](/)

***

# Variable: EventVolunteerGroupInput

> `const` **EventVolunteerGroupInput**: `InputObjectRef`\<`ExtendDefaultTypes`\<\{ `Context`: [`GraphQLContext`](../../../context/type-aliases/GraphQLContext.md); `Scalars`: [`CustomScalars`](../../../scalars/type-aliases/CustomScalars.md); \}\>, \{ `description?`: `null` \| `string`; `eventId`: `string`; `leaderId`: `string`; `name`: `string`; `recurringEventInstanceId?`: `null` \| `string`; `scope?`: `null` \| `NonNullable`\<`undefined` \| `"ENTIRE_SERIES"` \| `"THIS_INSTANCE_ONLY"`\>; `volunteersRequired?`: `null` \| `number`; `volunteerUserIds?`: `null` \| `string`[]; \}\>

Defined in: [src/graphql/inputs/EventVolunteerGroupInput.ts:37](https://github.com/Sourya07/talawa-api/blob/3df16fa5fb47e8947dc575f048aef648ae9ebcf8/src/graphql/inputs/EventVolunteerGroupInput.ts#L37)

GraphQL input type for creating an EventVolunteerGroup.
Matches the old Talawa API EventVolunteerGroupInput structure.
