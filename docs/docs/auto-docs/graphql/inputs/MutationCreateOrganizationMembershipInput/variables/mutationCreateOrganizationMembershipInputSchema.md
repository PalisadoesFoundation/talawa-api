[**talawa-api**](../../../../README.md)

***

# Variable: mutationCreateOrganizationMembershipInputSchema

> `const` **mutationCreateOrganizationMembershipInputSchema**: `ZodObject`\<`Pick`\<\{ `createdAt`: `ZodOptional`\<`ZodDate`\>; `creatorId`: `ZodNullable`\<`ZodOptional`\<`ZodNullable`\<`ZodString`\>\>\>; `memberId`: `ZodString`; `organizationId`: `ZodString`; `role`: `ZodString`; `updatedAt`: `ZodOptional`\<`ZodNullable`\<`ZodDate`\>\>; `updaterId`: `ZodNullable`\<`ZodOptional`\<`ZodNullable`\<`ZodString`\>\>\>; \}, `"organizationId"` \| `"memberId"`\> & `object`, `"strip"`, `ZodTypeAny`, \{ `memberId`: `string`; `organizationId`: `string`; `role?`: `string`; \}, \{ `memberId`: `string`; `organizationId`: `string`; `role?`: `string`; \}\>

Defined in: src/graphql/inputs/MutationCreateOrganizationMembershipInput.ts:6
