[Admin Docs](/)

***

# Variable: mutationSignUpInputSchema

> `const` **mutationSignUpInputSchema**: `ZodObject`\<`extendShape`\<`Omit`\<\{ `emailAddress`: `ZodTypeAny`; `isEmailAddressVerified`: `ZodTypeAny`; `name`: `ZodTypeAny`; `passwordHash`: `ZodTypeAny`; `role`: `ZodTypeAny`; \}, `"id"` \| `"name"` \| `"createdAt"` \| `"avatarMimeType"` \| `"avatarName"` \| `"creatorId"` \| `"emailAddress"` \| `"isEmailAddressVerified"` \| `"passwordHash"` \| `"role"` \| `"updatedAt"` \| `"updaterId"`\>, \{ `avatar`: `ZodOptional`\<`ZodNullable`\<`ZodType`\<`Promise`\<`FileUpload`\>, `ZodTypeDef`, `Promise`\<`FileUpload`\>\>\>\>; `password`: `ZodString`; `selectedOrganization`: `ZodString`; \}\>, `"strip"`, `ZodTypeAny`, \{ `avatar?`: `Promise`\<`FileUpload`\>; `password?`: `string`; `selectedOrganization?`: `string`; \}, \{ `avatar?`: `Promise`\<`FileUpload`\>; `password?`: `string`; `selectedOrganization?`: `string`; \}\>

Defined in: src/graphql/inputs/MutationSignUpInput.ts:12
