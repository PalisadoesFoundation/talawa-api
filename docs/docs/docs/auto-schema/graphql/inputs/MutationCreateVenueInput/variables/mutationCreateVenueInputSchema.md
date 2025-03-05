[Admin Docs](/)

***

# Variable: mutationCreateVenueInputSchema

> `const` **mutationCreateVenueInputSchema**: `ZodObject`\<`extendShape`\<`Pick`\<\{ `name`: `ZodTypeAny`; `organizationId`: `ZodTypeAny`; \}, `"name"` \| `"organizationId"`\>, \{ `attachments`: `ZodOptional`\<`ZodArray`\<`ZodType`\<`Promise`\<`FileUpload`\>, `ZodTypeDef`, `Promise`\<`FileUpload`\>\>, `"many"`\>\>; \}\>, `"strip"`, `ZodTypeAny`, \{ `attachments`: `Promise`\<`FileUpload`\>[]; `name`: `any`; `organizationId`: `any`; \}, \{ `attachments`: `Promise`\<`FileUpload`\>[]; `name`: `any`; `organizationId`: `any`; \}\>

Defined in: [src/graphql/inputs/MutationCreateVenueInput.ts:6](https://github.com/PalisadoesFoundation/talawa-api/blob/36e30b39ce897bdded5fea4859d9ae00485b5a4c/src/graphql/inputs/MutationCreateVenueInput.ts#L6)
