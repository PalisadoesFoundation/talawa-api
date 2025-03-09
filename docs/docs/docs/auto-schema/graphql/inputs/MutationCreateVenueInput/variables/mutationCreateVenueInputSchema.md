[Admin Docs](/)

***

# Variable: mutationCreateVenueInputSchema

> `const` **mutationCreateVenueInputSchema**: `ZodObject`\<`extendShape`\<`Pick`\<\{ `name`: `ZodTypeAny`; `organizationId`: `ZodTypeAny`; \}, `"name"` \| `"organizationId"`\>, \{ `attachments`: `ZodOptional`\<`ZodArray`\<`ZodType`\<`Promise`\<`FileUpload`\>, `ZodTypeDef`, `Promise`\<`FileUpload`\>\>, `"many"`\>\>; \}\>, `"strip"`, `ZodTypeAny`, \{ `attachments`: `Promise`\<`FileUpload`\>[]; `name`: `any`; `organizationId`: `any`; \}, \{ `attachments`: `Promise`\<`FileUpload`\>[]; `name`: `any`; `organizationId`: `any`; \}\>

Defined in: [src/graphql/inputs/MutationCreateVenueInput.ts:6](https://github.com/syedali237/talawa-api/blob/98bc58250f2ff99b91cd3ae158cc2ad171f7d560/src/graphql/inputs/MutationCreateVenueInput.ts#L6)
