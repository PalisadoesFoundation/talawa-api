[Admin Docs](/)

***

# Variable: MutationCreateEventInput

> `const` **MutationCreateEventInput**: `InputObjectRef`\<`ExtendDefaultTypes`\<\{ `Context`: [`GraphQLContext`](../../../context/type-aliases/GraphQLContext.md); `Scalars`: [`CustomScalars`](../../../scalars/type-aliases/CustomScalars.md); \}\>, \{ `allDay?`: `null` \| `NonNullable`\<`undefined` \| `boolean`\>; `attachments?`: `null` \| `Promise`\<`FileUpload`\>[]; `description?`: `null` \| `string`; `endAt`: `Date`; `isPublic?`: `null` \| `NonNullable`\<`undefined` \| `boolean`\>; `isRegisterable?`: `null` \| `NonNullable`\<`undefined` \| `boolean`\>; `location?`: `null` \| `string`; `name`: `string`; `organizationId`: `string`; `recurrence?`: `null` \| \{ `byDay?`: `null` \| `string`[]; `byMonth?`: `null` \| `number`[]; `byMonthDay?`: `null` \| `number`[]; `count?`: `null` \| `number`; `endDate?`: `null` \| `Date`; `frequency`: `NonNullable`\<`"DAILY"` \| `"WEEKLY"` \| `"MONTHLY"` \| `"YEARLY"`\>; `interval?`: `null` \| `number`; `never?`: `null` \| `NonNullable`\<`undefined` \| `boolean`\>; \}; `startAt`: `Date`; \}\>

Defined in: [src/graphql/inputs/MutationCreateEventInput.ts:38](https://github.com/Sourya07/talawa-api/blob/3df16fa5fb47e8947dc575f048aef648ae9ebcf8/src/graphql/inputs/MutationCreateEventInput.ts#L38)
