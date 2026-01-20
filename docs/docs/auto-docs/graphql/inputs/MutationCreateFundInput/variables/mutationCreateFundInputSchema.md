[API Docs](/)

***

# Variable: mutationCreateFundInputSchema

> `const` **mutationCreateFundInputSchema**: `ZodObject`\<`Pick`\<\{ `createdAt`: `ZodOptional`\<`ZodDate`\>; `creatorId`: `ZodNullable`\<`ZodOptional`\<`ZodNullable`\<`ZodString`\>\>\>; `id`: `ZodOptional`\<`ZodString`\>; `isArchived`: `ZodOptional`\<`ZodBoolean`\>; `isDefault`: `ZodOptional`\<`ZodBoolean`\>; `isTaxDeductible`: `ZodBoolean`; `name`: `ZodString`; `organizationId`: `ZodString`; `referenceNumber`: `ZodNullable`\<`ZodOptional`\<`ZodNullable`\<`ZodString`\>\>\>; `updatedAt`: `ZodNullable`\<`ZodOptional`\<`ZodDate`\>\>; `updaterId`: `ZodNullable`\<`ZodOptional`\<`ZodNullable`\<`ZodString`\>\>\>; \}, `"name"` \| `"organizationId"` \| `"isTaxDeductible"` \| `"isDefault"` \| `"isArchived"` \| `"referenceNumber"`\>, `"strip"`, `ZodTypeAny`, \{ `isArchived?`: `boolean`; `isDefault?`: `boolean`; `isTaxDeductible`: `boolean`; `name`: `string`; `organizationId`: `string`; `referenceNumber?`: `string` \| `null`; \}, \{ `isArchived?`: `boolean`; `isDefault?`: `boolean`; `isTaxDeductible`: `boolean`; `name`: `string`; `organizationId`: `string`; `referenceNumber?`: `string` \| `null`; \}\>

Defined in: src/graphql/inputs/MutationCreateFundInput.ts:5
