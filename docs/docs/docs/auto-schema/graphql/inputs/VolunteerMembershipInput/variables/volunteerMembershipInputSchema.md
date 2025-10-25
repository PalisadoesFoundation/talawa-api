[Admin Docs](/)

***

# Variable: volunteerMembershipInputSchema

> `const` **volunteerMembershipInputSchema**: `ZodObject`\<\{ `event`: `ZodString`; `group`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `recurringEventInstanceId`: `ZodOptional`\<`ZodString`\>; `scope`: `ZodOptional`\<`ZodEnum`\<\[`"ENTIRE_SERIES"`, `"THIS_INSTANCE_ONLY"`\]\>\>; `status`: `ZodEnum`\<\[`"invited"`, `"requested"`, `"accepted"`, `"rejected"`\]\>; `userId`: `ZodString`; \}, `"strip"`, `ZodTypeAny`, \{ `event`: `string`; `group?`: `null` \| `string`; `recurringEventInstanceId?`: `string`; `scope?`: `"ENTIRE_SERIES"` \| `"THIS_INSTANCE_ONLY"`; `status`: `"rejected"` \| `"invited"` \| `"requested"` \| `"accepted"`; `userId`: `string`; \}, \{ `event`: `string`; `group?`: `null` \| `string`; `recurringEventInstanceId?`: `string`; `scope?`: `"ENTIRE_SERIES"` \| `"THIS_INSTANCE_ONLY"`; `status`: `"rejected"` \| `"invited"` \| `"requested"` \| `"accepted"`; `userId`: `string`; \}\>

Defined in: [src/graphql/inputs/VolunteerMembershipInput.ts:19](https://github.com/Sourya07/talawa-api/blob/61a1911602b2f0aac7635e08ae2918f4f768e8ff/src/graphql/inputs/VolunteerMembershipInput.ts#L19)

Zod schema for VolunteerMembershipInput validation.
Based on the old Talawa API VolunteerMembershipInput structure.
