[API Docs](/)

***

# Variable: mutationUpdateThisAndFollowingEventsInputSchema

> `const` **mutationUpdateThisAndFollowingEventsInputSchema**: `ZodObject`\<\{ `allDay`: `ZodOptional`\<`ZodBoolean`\>; `description`: `ZodOptional`\<`ZodString`\>; `endAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodString`; `isInviteOnly`: `ZodOptional`\<`ZodBoolean`\>; `isPublic`: `ZodOptional`\<`ZodBoolean`\>; `isRegisterable`: `ZodOptional`\<`ZodBoolean`\>; `location`: `ZodOptional`\<`ZodString`\>; `name`: `ZodOptional`\<`ZodString`\>; `recurrence`: `ZodOptional`\<`ZodObject`\<\{ `byDay`: `ZodOptional`\<`ZodArray`\<`ZodString`\>\>; `byMonth`: `ZodOptional`\<`ZodArray`\<`ZodNumber`\>\>; `byMonthDay`: `ZodOptional`\<`ZodArray`\<`ZodNumber`\>\>; `count`: `ZodOptional`\<`ZodNumber`\>; `endDate`: `ZodOptional`\<`ZodDate`\>; `frequency`: `ZodEnum`\<\{ `DAILY`: `"DAILY"`; `MONTHLY`: `"MONTHLY"`; `WEEKLY`: `"WEEKLY"`; `YEARLY`: `"YEARLY"`; \}\>; `interval`: `ZodOptional`\<`ZodNumber`\>; `never`: `ZodOptional`\<`ZodBoolean`\>; \}, `$strip`\>\>; `startAt`: `ZodOptional`\<`ZodDate`\>; \}, `$strip`\>

Defined in: [src/graphql/inputs/MutationUpdateThisAndFollowingEventsInput.ts:6](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/inputs/MutationUpdateThisAndFollowingEventsInput.ts#L6)
