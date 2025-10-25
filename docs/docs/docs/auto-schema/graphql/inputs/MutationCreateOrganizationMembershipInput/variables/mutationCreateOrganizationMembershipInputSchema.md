[Admin Docs](/)

***

# Variable: mutationCreateOrganizationMembershipInputSchema

> `const` **mutationCreateOrganizationMembershipInputSchema**: `ZodObject`\<`extendShape`\<`Pick`\<\{ `createdAt`: `ZodOptional`\<`ZodDate`\>; `creatorId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `memberId`: `ZodString`; `organizationId`: `ZodString`; `role`: `ZodEnum`\<\[`"administrator"`, `"regular"`\]\>; `updatedAt`: `ZodOptional`\<`ZodNullable`\<`ZodDate`\>\>; `updaterId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `"organizationId"` \| `"memberId"`\>, \{ `role`: `ZodOptional`\<`ZodEnum`\<\[`"administrator"`, `"regular"`\]\>\>; \}\>, `"strip"`, `ZodTypeAny`, \{ `memberId`: `string`; `organizationId`: `string`; `role?`: `"administrator"` \| `"regular"`; \}, \{ `memberId`: `string`; `organizationId`: `string`; `role?`: `"administrator"` \| `"regular"`; \}\>

Defined in: [src/graphql/inputs/MutationCreateOrganizationMembershipInput.ts:6](https://github.com/Sourya07/talawa-api/blob/ead7a48e0174153214ee7311f8b242ee1c1a12ca/src/graphql/inputs/MutationCreateOrganizationMembershipInput.ts#L6)
