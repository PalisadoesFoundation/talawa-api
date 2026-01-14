[**talawa-api**](../../../../README.md)

***

# Variable: MutationCreateEventInput

> `const` **MutationCreateEventInput**: `InputObjectRef`\<`ExtendDefaultTypes`\<\{ `Context`: [`GraphQLContext`](../../../context/type-aliases/GraphQLContext.md); `Scalars`: [`CustomScalars`](../../../scalars/type-aliases/CustomScalars.md); \}\>, \{ `allDay?`: `NonNullable`\<`boolean` \| `undefined`\> \| `null`; `attachments?`: `Promise`\<`FileUpload`\>[] \| `null`; `description?`: `string` \| `null`; `endAt`: `Date`; `isInviteOnly?`: `NonNullable`\<`boolean` \| `undefined`\> \| `null`; `isPublic?`: `NonNullable`\<`boolean` \| `undefined`\> \| `null`; `isRegisterable?`: `NonNullable`\<`boolean` \| `undefined`\> \| `null`; `location?`: `string` \| `null`; `name`: `string`; `organizationId`: `string`; `recurrence?`: \{ `byDay?`: `string`[] \| `null`; `byMonth?`: `number`[] \| `null`; `byMonthDay?`: `number`[] \| `null`; `count?`: `number` \| `null`; `endDate?`: `Date` \| `null`; `frequency`: `NonNullable`\<`"DAILY"` \| `"WEEKLY"` \| `"MONTHLY"` \| `"YEARLY"`\>; `interval?`: `number` \| `null`; `never?`: `NonNullable`\<`boolean` \| `undefined`\> \| `null`; \} \| `null`; `startAt`: `Date`; \}\>

Defined in: [src/graphql/inputs/MutationCreateEventInput.ts:51](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/graphql/inputs/MutationCreateEventInput.ts#L51)
