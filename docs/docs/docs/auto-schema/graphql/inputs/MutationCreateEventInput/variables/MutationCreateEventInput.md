[Admin Docs](/)

***

# Variable: MutationCreateEventInput

> `const` **MutationCreateEventInput**: `InputObjectRef`\<`ExtendDefaultTypes`\<\{ `Context`: [`GraphQLContext`](../../../context/type-aliases/GraphQLContext.md); `Scalars`: [`CustomScalars`](../../../scalars/type-aliases/CustomScalars.md); \}\>, \{ `allDay?`: `null` \| `NonNullable`\<`undefined` \| `boolean`\>; `attachments?`: `null` \| `Promise`\<`FileUpload`\>[]; `description?`: `null` \| `string`; `endAt`: `Date`; `isPublic?`: `null` \| `NonNullable`\<`undefined` \| `boolean`\>; `isRegisterable?`: `null` \| `NonNullable`\<`undefined` \| `boolean`\>; `location?`: `null` \| `string`; `name`: `string`; `organizationId`: `string`; `recurrence?`: `null` \| \{ `byDay?`: `null` \| `string`[]; `byMonth?`: `null` \| `number`[]; `byMonthDay?`: `null` \| `number`[]; `count?`: `null` \| `number`; `endDate?`: `null` \| `Date`; `frequency`: `NonNullable`\<`"DAILY"` \| `"WEEKLY"` \| `"MONTHLY"` \| `"YEARLY"`\>; `interval?`: `null` \| `number`; `never?`: `null` \| `NonNullable`\<`undefined` \| `boolean`\>; \}; `startAt`: `Date`; \}\>

Defined in: [src/graphql/inputs/MutationCreateEventInput.ts:38](https://github.com/Sourya07/talawa-api/blob/61a1911602b2f0aac7635e08ae2918f4f768e8ff/src/graphql/inputs/MutationCreateEventInput.ts#L38)
