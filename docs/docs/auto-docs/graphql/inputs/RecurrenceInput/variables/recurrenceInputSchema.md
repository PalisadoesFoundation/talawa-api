[API Docs](/)

***

# Variable: recurrenceInputSchema

> `const` **recurrenceInputSchema**: `ZodEffects`\<`ZodObject`\<\{ `byDay`: `ZodOptional`\<`ZodArray`\<`ZodString`, `"many"`\>\>; `byMonth`: `ZodOptional`\<`ZodArray`\<`ZodNumber`, `"many"`\>\>; `byMonthDay`: `ZodOptional`\<`ZodArray`\<`ZodNumber`, `"many"`\>\>; `count`: `ZodOptional`\<`ZodNumber`\>; `endDate`: `ZodOptional`\<`ZodDate`\>; `frequency`: `ZodEnum`\<\[`"DAILY"`, `"WEEKLY"`, `"MONTHLY"`, `"YEARLY"`\]\>; `interval`: `ZodOptional`\<`ZodNumber`\>; `never`: `ZodOptional`\<`ZodBoolean`\>; \}, `"strip"`, `ZodTypeAny`, \{ `byDay?`: `string`[]; `byMonth?`: `number`[]; `byMonthDay?`: `number`[]; `count?`: `number`; `endDate?`: `Date`; `frequency`: `"DAILY"` \| `"WEEKLY"` \| `"MONTHLY"` \| `"YEARLY"`; `interval?`: `number`; `never?`: `boolean`; \}, \{ `byDay?`: `string`[]; `byMonth?`: `number`[]; `byMonthDay?`: `number`[]; `count?`: `number`; `endDate?`: `Date`; `frequency`: `"DAILY"` \| `"WEEKLY"` \| `"MONTHLY"` \| `"YEARLY"`; `interval?`: `number`; `never?`: `boolean`; \}\>, \{ `byDay?`: `string`[]; `byMonth?`: `number`[]; `byMonthDay?`: `number`[]; `count?`: `number`; `endDate?`: `Date`; `frequency`: `"DAILY"` \| `"WEEKLY"` \| `"MONTHLY"` \| `"YEARLY"`; `interval?`: `number`; `never?`: `boolean`; \}, \{ `byDay?`: `string`[]; `byMonth?`: `number`[]; `byMonthDay?`: `number`[]; `count?`: `number`; `endDate?`: `Date`; `frequency`: `"DAILY"` \| `"WEEKLY"` \| `"MONTHLY"` \| `"YEARLY"`; `interval?`: `number`; `never?`: `boolean`; \}\>

Defined in: src/graphql/inputs/RecurrenceInput.ts:6
