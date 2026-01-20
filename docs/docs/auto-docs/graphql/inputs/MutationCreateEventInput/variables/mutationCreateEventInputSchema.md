[API Docs](/)

***

# Variable: mutationCreateEventInputSchema

> `const` **mutationCreateEventInputSchema**: `ZodObject`\<\{ `allDay`: `ZodOptional`\<`ZodBoolean`\>; `attachments`: `ZodOptional`\<`ZodArray`\<`ZodCustom`\<`Promise`\<`FileUpload`\>, `Promise`\<`FileUpload`\>\>\>\>; `description`: `ZodOptional`\<`ZodString`\>; `endAt`: `ZodDate`; `isInviteOnly`: `ZodOptional`\<`ZodBoolean`\>; `isPublic`: `ZodOptional`\<`ZodBoolean`\>; `isRegisterable`: `ZodOptional`\<`ZodBoolean`\>; `location`: `ZodOptional`\<`ZodString`\>; `name`: `ZodString`; `organizationId`: `ZodUUID`; `recurrence`: `ZodOptional`\<`ZodObject`\<\{ `byDay`: `ZodOptional`\<`ZodArray`\<`ZodString`\>\>; `byMonth`: `ZodOptional`\<`ZodArray`\<`ZodNumber`\>\>; `byMonthDay`: `ZodOptional`\<`ZodArray`\<`ZodNumber`\>\>; `count`: `ZodOptional`\<`ZodNumber`\>; `endDate`: `ZodOptional`\<`ZodDate`\>; `frequency`: `ZodEnum`\<\{ `DAILY`: `"DAILY"`; `MONTHLY`: `"MONTHLY"`; `WEEKLY`: `"WEEKLY"`; `YEARLY`: `"YEARLY"`; \}\>; `interval`: `ZodOptional`\<`ZodNumber`\>; `never`: `ZodOptional`\<`ZodBoolean`\>; \}, `$strip`\>\>; `startAt`: `ZodDate`; \}, \{ \}\>

Defined in: [src/graphql/inputs/MutationCreateEventInput.ts:13](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/inputs/MutationCreateEventInput.ts#L13)
