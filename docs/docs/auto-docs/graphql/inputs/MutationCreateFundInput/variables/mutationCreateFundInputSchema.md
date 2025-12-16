[API Docs](/)

***

# Variable: mutationCreateFundInputSchema

> `const` **mutationCreateFundInputSchema**: `ZodObject`\<`Pick`\<\{ `createdAt`: `ZodOptional`\<`ZodDate`\>; `creatorId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `id`: `ZodOptional`\<`ZodString`\>; `isArchived`: `ZodOptional`\<`ZodBoolean`\>; `isDefault`: `ZodOptional`\<`ZodBoolean`\>; `isTaxDeductible`: `ZodBoolean`; `name`: `ZodString`; `organizationId`: `ZodString`; `referenceNumber`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `updatedAt`: `ZodOptional`\<`ZodNullable`\<`ZodDate`\>\>; `updaterId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `"name"` \| `"organizationId"` \| `"isTaxDeductible"` \| `"isDefault"` \| `"isArchived"` \| `"referenceNumber"`\>, `"strip"`, `ZodTypeAny`, \{ `isArchived?`: `boolean`; `isDefault?`: `boolean`; `isTaxDeductible`: `boolean`; `name`: `string`; `organizationId`: `string`; `referenceNumber?`: `string` \| `null`; \}, \{ `isArchived?`: `boolean`; `isDefault?`: `boolean`; `isTaxDeductible`: `boolean`; `name`: `string`; `organizationId`: `string`; `referenceNumber?`: `string` \| `null`; \}\>

Defined in: [src/graphql/inputs/MutationCreateFundInput.ts:5](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/inputs/MutationCreateFundInput.ts#L5)
