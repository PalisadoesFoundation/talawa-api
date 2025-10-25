[Admin Docs](/)

***

# Variable: mutationCreateFundInputSchema

> `const` **mutationCreateFundInputSchema**: `ZodObject`\<`Pick`\<\{ `createdAt`: `ZodOptional`\<`ZodDate`\>; `creatorId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `id`: `ZodOptional`\<`ZodString`\>; `isTaxDeductible`: `ZodBoolean`; `name`: `ZodString`; `organizationId`: `ZodString`; `updatedAt`: `ZodOptional`\<`ZodNullable`\<`ZodDate`\>\>; `updaterId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `"name"` \| `"organizationId"` \| `"isTaxDeductible"`\>, `"strip"`, `ZodTypeAny`, \{ `isTaxDeductible`: `boolean`; `name`: `string`; `organizationId`: `string`; \}, \{ `isTaxDeductible`: `boolean`; `name`: `string`; `organizationId`: `string`; \}\>

Defined in: [src/graphql/inputs/MutationCreateFundInput.ts:5](https://github.com/Sourya07/talawa-api/blob/583d62db9438de398bb9012a4a2617e2cb268b08/src/graphql/inputs/MutationCreateFundInput.ts#L5)
