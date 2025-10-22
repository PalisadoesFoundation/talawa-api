[Admin Docs](/)

***

# Variable: sendMembershipRequestInputSchema

> `const` **sendMembershipRequestInputSchema**: `ZodObject`\<`Pick`\<\{ `createdAt`: `ZodOptional`\<`ZodDate`\>; `membershipRequestId`: `ZodOptional`\<`ZodString`\>; `organizationId`: `ZodString`; `status`: `ZodOptional`\<`ZodEnum`\<\[`"pending"`, `"approved"`, `"rejected"`\]\>\>; `userId`: `ZodString`; \}, `"organizationId"`\>, `"strip"`, `ZodTypeAny`, \{ `organizationId`: `string`; \}, \{ `organizationId`: `string`; \}\>

Defined in: [src/graphql/inputs/MutationSendMembershipRequestInput.ts:5](https://github.com/Sourya07/talawa-api/blob/aac5f782223414da32542752c1be099f0b872196/src/graphql/inputs/MutationSendMembershipRequestInput.ts#L5)
