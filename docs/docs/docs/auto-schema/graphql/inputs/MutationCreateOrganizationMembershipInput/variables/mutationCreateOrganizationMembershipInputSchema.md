[Admin Docs](/)

***

# Variable: mutationCreateOrganizationMembershipInputSchema

> `const` **mutationCreateOrganizationMembershipInputSchema**: `ZodObject`\<`extendShape`\<`Pick`\<\{ `createdAt`: `ZodOptional`\<`ZodDate`\>; `creatorId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `memberId`: `ZodString`; `organizationId`: `ZodString`; `role`: `ZodEnum`\<\[`"administrator"`, `"regular"`\]\>; `updatedAt`: `ZodOptional`\<`ZodNullable`\<`ZodDate`\>\>; `updaterId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `"organizationId"` \| `"memberId"`\>, \{ `role`: `ZodOptional`\<`ZodEnum`\<\[`"administrator"`, `"regular"`\]\>\>; \}\>, `"strip"`, `ZodTypeAny`, \{ `memberId`: `string`; `organizationId`: `string`; `role?`: `"administrator"` \| `"regular"`; \}, \{ `memberId`: `string`; `organizationId`: `string`; `role?`: `"administrator"` \| `"regular"`; \}\>

Defined in: [src/graphql/inputs/MutationCreateOrganizationMembershipInput.ts:6](https://github.com/Sourya07/talawa-api/blob/61a1911602b2f0aac7635e08ae2918f4f768e8ff/src/graphql/inputs/MutationCreateOrganizationMembershipInput.ts#L6)
