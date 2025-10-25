[Admin Docs](/)

***

# Variable: sendMembershipRequestInputSchema

> `const` **sendMembershipRequestInputSchema**: `ZodObject`\<`Pick`\<\{ `createdAt`: `ZodOptional`\<`ZodDate`\>; `membershipRequestId`: `ZodOptional`\<`ZodString`\>; `organizationId`: `ZodString`; `status`: `ZodOptional`\<`ZodEnum`\<\[`"pending"`, `"approved"`, `"rejected"`\]\>\>; `userId`: `ZodString`; \}, `"organizationId"`\>, `"strip"`, `ZodTypeAny`, \{ `organizationId`: `string`; \}, \{ `organizationId`: `string`; \}\>

Defined in: [src/graphql/inputs/MutationSendMembershipRequestInput.ts:5](https://github.com/Sourya07/talawa-api/blob/61a1911602b2f0aac7635e08ae2918f4f768e8ff/src/graphql/inputs/MutationSendMembershipRequestInput.ts#L5)
