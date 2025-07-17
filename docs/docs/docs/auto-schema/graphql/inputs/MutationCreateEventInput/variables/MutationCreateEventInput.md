[Admin Docs](/)

***

# Variable: MutationCreateEventInput

> `const` **MutationCreateEventInput**: `InputObjectRef`\<`ExtendDefaultTypes`\<\{ `Context`: [`GraphQLContext`](../../../context/type-aliases/GraphQLContext.md); `Scalars`: [`CustomScalars`](../../../scalars/type-aliases/CustomScalars.md); \}\>, \{ `allDay?`: `boolean`; `attachments?`: `Promise`\<`FileUpload`\>[]; `description?`: `object`[]; `instanceStartTime?`: `Date`; `isPublic?`: `boolean`; `isRecurringTemplate?`: `boolean`; `isRegisterable?`: `boolean`; `location?`: `string`; `name?`: `object`[]; `recurrence?`: \{ `byDay?`: `string`[]; `byMonth?`: `number`[]; `byMonthDay?`: `number`[]; `count?`: `number`; `endDate?`: `Date`; `frequency?`: `NonNullable`\<`"DAILY"` \| `"WEEKLY"` \| `"MONTHLY"` \| `"YEARLY"`\>; `interval?`: `number`; `never?`: `boolean`; \}; `recurringEventId?`: `string`; \}\>

Defined in: [src/graphql/inputs/MutationCreateEventInput.ts:38](https://github.com/gautam-divyanshu/talawa-api/blob/1d38acecd3e456f869683fb8dca035a5e42010d5/src/graphql/inputs/MutationCreateEventInput.ts#L38)
