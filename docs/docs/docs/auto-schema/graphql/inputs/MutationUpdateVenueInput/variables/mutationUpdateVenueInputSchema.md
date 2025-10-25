[Admin Docs](/)

***

# Variable: mutationUpdateVenueInputSchema

> `const` **mutationUpdateVenueInputSchema**: `ZodEffects`\<`ZodObject`\<`extendShape`\<`Pick`\<\{ `capacity`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `creatorId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `description`: `ZodNullable`\<`ZodOptional`\<`ZodString`\>\>; `id`: `ZodOptional`\<`ZodString`\>; `name`: `ZodString`; `organizationId`: `ZodString`; `updatedAt`: `ZodOptional`\<`ZodNullable`\<`ZodDate`\>\>; `updaterId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `"description"` \| `"capacity"`\>, \{ `attachments`: `ZodOptional`\<`ZodArray`\<`ZodType`\<`Promise`\<`FileUpload`\>, `ZodTypeDef`, `Promise`\<`FileUpload`\>\>, `"many"`\>\>; `id`: `ZodString`; `name`: `ZodOptional`\<`ZodString`\>; \}\>, `"strip"`, `ZodTypeAny`, \{ `attachments?`: `Promise`\<`FileUpload`\>[]; `capacity?`: `null` \| `number`; `description?`: `null` \| `string`; `id`: `string`; `name?`: `string`; \}, \{ `attachments?`: `Promise`\<`FileUpload`\>[]; `capacity?`: `null` \| `number`; `description?`: `null` \| `string`; `id`: `string`; `name?`: `string`; \}\>, \{ `attachments?`: `Promise`\<`FileUpload`\>[]; `capacity?`: `null` \| `number`; `description?`: `null` \| `string`; `id`: `string`; `name?`: `string`; \}, \{ `attachments?`: `Promise`\<`FileUpload`\>[]; `capacity?`: `null` \| `number`; `description?`: `null` \| `string`; `id`: `string`; `name?`: `string`; \}\>

Defined in: [src/graphql/inputs/MutationUpdateVenueInput.ts:6](https://github.com/Sourya07/talawa-api/blob/4e4298c85a0d2c28affa824f2aab7ec32b5f3ac5/src/graphql/inputs/MutationUpdateVenueInput.ts#L6)
