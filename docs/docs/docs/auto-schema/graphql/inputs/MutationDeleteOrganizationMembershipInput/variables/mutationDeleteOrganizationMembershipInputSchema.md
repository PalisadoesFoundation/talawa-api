[Admin Docs](/)

***

# Variable: mutationDeleteOrganizationMembershipInputSchema

> `const` **mutationDeleteOrganizationMembershipInputSchema**: `ZodObject`\<`Pick`\<\{ `createdAt`: `ZodOptional`\<`ZodDate`\>; `creatorId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `memberId`: `ZodString`; `organizationId`: `ZodString`; `role`: `ZodEnum`\<\[`"administrator"`, `"regular"`\]\>; `updatedAt`: `ZodOptional`\<`ZodNullable`\<`ZodDate`\>\>; `updaterId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `"organizationId"` \| `"memberId"`\>, `"strip"`, `ZodTypeAny`, \{ `memberId`: `string`; `organizationId`: `string`; \}, \{ `memberId`: `string`; `organizationId`: `string`; \}\>

Defined in: [src/graphql/inputs/MutationDeleteOrganizationMembershipInput.ts:5](https://github.com/Sourya07/talawa-api/blob/3df16fa5fb47e8947dc575f048aef648ae9ebcf8/src/graphql/inputs/MutationDeleteOrganizationMembershipInput.ts#L5)
