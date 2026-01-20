[API Docs](/)

***

# Variable: mutationCreateAdvertisementInputSchema

> `const` **mutationCreateAdvertisementInputSchema**: `ZodEffects`\<`ZodObject`\<`Pick`\<\{ `createdAt`: `ZodOptional`\<`ZodDate`\>; `creatorId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `description`: `ZodNullable`\<`ZodOptional`\<`ZodString`\>\>; `endAt`: `ZodDate`; `id`: `ZodOptional`\<`ZodString`\>; `name`: `ZodString`; `organizationId`: `ZodString`; `startAt`: `ZodDate`; `type`: `ZodString`; `updatedAt`: `ZodOptional`\<`ZodNullable`\<`ZodDate`\>\>; `updaterId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `"type"` \| `"description"` \| `"name"` \| `"organizationId"` \| `"endAt"` \| `"startAt"`\> & `object`, `"strip"`, `ZodTypeAny`, \{ `attachments?`: `Promise`\<`FileUpload`\>[]; `description?`: `string` \| `null`; `endAt`: `Date`; `name`: `string`; `organizationId`: `string`; `startAt`: `Date`; `type`: `string`; \}, \{ `attachments?`: `Promise`\<`FileUpload`\>[]; `description?`: `string` \| `null`; `endAt`: `Date`; `name`: `string`; `organizationId`: `string`; `startAt`: `Date`; `type`: `string`; \}\>, \{ `attachments?`: `Promise`\<`FileUpload`\>[]; `description?`: `string` \| `null`; `endAt`: `Date`; `name`: `string`; `organizationId`: `string`; `startAt`: `Date`; `type`: `string`; \}, \{ `attachments?`: `Promise`\<`FileUpload`\>[]; `description?`: `string` \| `null`; `endAt`: `Date`; `name`: `string`; `organizationId`: `string`; `startAt`: `Date`; `type`: `string`; \}\>

Defined in: [src/graphql/inputs/MutationCreateAdvertisementInput.ts:7](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/inputs/MutationCreateAdvertisementInput.ts#L7)
