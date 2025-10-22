[Admin Docs](/)

***

# Variable: mutationDeleteOrganizationMembershipInputSchema

> `const` **mutationDeleteOrganizationMembershipInputSchema**: `ZodObject`\<`Pick`\<\{ `createdAt`: `ZodOptional`\<`ZodDate`\>; `creatorId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `memberId`: `ZodString`; `organizationId`: `ZodString`; `role`: `ZodEnum`\<\[`"administrator"`, `"regular"`\]\>; `updatedAt`: `ZodOptional`\<`ZodNullable`\<`ZodDate`\>\>; `updaterId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `"organizationId"` \| `"memberId"`\>, `"strip"`, `ZodTypeAny`, \{ `memberId`: `string`; `organizationId`: `string`; \}, \{ `memberId`: `string`; `organizationId`: `string`; \}\>

Defined in: [src/graphql/inputs/MutationDeleteOrganizationMembershipInput.ts:5](https://github.com/Sourya07/talawa-api/blob/aac5f782223414da32542752c1be099f0b872196/src/graphql/inputs/MutationDeleteOrganizationMembershipInput.ts#L5)
