[API Docs](/)

***

# Variable: recurrenceInputSchema

> `const` **recurrenceInputSchema**: `ZodObject`\<\{ `byDay`: `ZodOptional`\<`ZodArray`\<`ZodString`\>\>; `byMonth`: `ZodOptional`\<`ZodArray`\<`ZodNumber`\>\>; `byMonthDay`: `ZodOptional`\<`ZodArray`\<`ZodNumber`\>\>; `count`: `ZodOptional`\<`ZodNumber`\>; `endDate`: `ZodOptional`\<`ZodDate`\>; `frequency`: `ZodEnum`\<\{ `DAILY`: `"DAILY"`; `MONTHLY`: `"MONTHLY"`; `WEEKLY`: `"WEEKLY"`; `YEARLY`: `"YEARLY"`; \}\>; `interval`: `ZodOptional`\<`ZodNumber`\>; `never`: `ZodOptional`\<`ZodBoolean`\>; \}, `$strip`\>

Defined in: src/graphql/inputs/RecurrenceInput.ts:6
