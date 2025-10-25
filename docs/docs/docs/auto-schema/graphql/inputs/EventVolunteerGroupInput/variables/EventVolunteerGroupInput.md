[Admin Docs](/)

***

# Variable: EventVolunteerGroupInput

> `const` **EventVolunteerGroupInput**: `InputObjectRef`\<`ExtendDefaultTypes`\<\{ `Context`: [`GraphQLContext`](../../../context/type-aliases/GraphQLContext.md); `Scalars`: [`CustomScalars`](../../../scalars/type-aliases/CustomScalars.md); \}\>, \{ `description?`: `null` \| `string`; `eventId`: `string`; `leaderId`: `string`; `name`: `string`; `recurringEventInstanceId?`: `null` \| `string`; `scope?`: `null` \| `NonNullable`\<`undefined` \| `"ENTIRE_SERIES"` \| `"THIS_INSTANCE_ONLY"`\>; `volunteersRequired?`: `null` \| `number`; `volunteerUserIds?`: `null` \| `string`[]; \}\>

Defined in: [src/graphql/inputs/EventVolunteerGroupInput.ts:37](https://github.com/Sourya07/talawa-api/blob/4e4298c85a0d2c28affa824f2aab7ec32b5f3ac5/src/graphql/inputs/EventVolunteerGroupInput.ts#L37)

GraphQL input type for creating an EventVolunteerGroup.
Matches the old Talawa API EventVolunteerGroupInput structure.
