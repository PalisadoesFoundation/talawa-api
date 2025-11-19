[API Docs](/)

***

# Variable: volunteerMembershipInputSchema

> `const` **volunteerMembershipInputSchema**: `ZodObject`\<\{ `event`: `ZodString`; `group`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `recurringEventInstanceId`: `ZodOptional`\<`ZodString`\>; `scope`: `ZodOptional`\<`ZodEnum`\<\[`"ENTIRE_SERIES"`, `"THIS_INSTANCE_ONLY"`\]\>\>; `status`: `ZodEnum`\<\[`"invited"`, `"requested"`, `"accepted"`, `"rejected"`\]\>; `userId`: `ZodString`; \}, `"strip"`, `ZodTypeAny`, \{ `event`: `string`; `group?`: `string` \| `null`; `recurringEventInstanceId?`: `string`; `scope?`: `"ENTIRE_SERIES"` \| `"THIS_INSTANCE_ONLY"`; `status`: `"rejected"` \| `"invited"` \| `"requested"` \| `"accepted"`; `userId`: `string`; \}, \{ `event`: `string`; `group?`: `string` \| `null`; `recurringEventInstanceId?`: `string`; `scope?`: `"ENTIRE_SERIES"` \| `"THIS_INSTANCE_ONLY"`; `status`: `"rejected"` \| `"invited"` \| `"requested"` \| `"accepted"`; `userId`: `string`; \}\>

Defined in: src/graphql/inputs/VolunteerMembershipInput.ts:19

Zod schema for VolunteerMembershipInput validation.
Based on the old Talawa API VolunteerMembershipInput structure.
