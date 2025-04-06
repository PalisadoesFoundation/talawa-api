[Admin Docs](/)

***

# Variable: mutationSignUpInputSchema

> `const` **mutationSignUpInputSchema**: `ZodObject`\<`extendShape`\<`Omit`\<\{ `emailAddress`: `ZodTypeAny`; `name`: `ZodTypeAny`; \}, `"id"` \| `"name"` \| `"avatarMimeType"` \| `"avatarName"` \| `"createdAt"` \| `"creatorId"` \| `"emailAddress"` \| `"isEmailAddressVerified"` \| `"passwordHash"` \| `"role"` \| `"updatedAt"` \| `"updaterId"`\>, \{ `avatar`: `ZodOptional`\<`ZodNullable`\<`ZodType`\<`Promise`\<`FileUpload`\>, `ZodTypeDef`, `Promise`\<`FileUpload`\>\>\>\>; `password`: `ZodString`; `selectedOrganization`: `ZodString`; \}\>, `"strip"`, `ZodTypeAny`, \{ `avatar`: `Promise`\<`FileUpload`\>; `password`: `string`; `selectedOrganization`: `string`; \}, \{ `avatar`: `Promise`\<`FileUpload`\>; `password`: `string`; `selectedOrganization`: `string`; \}\>

Defined in: [src/graphql/inputs/MutationSignUpInput.ts:12](https://github.com/PurnenduMIshra129th/talawa-api/blob/dd95e2d2302936a5436289a9e626f7f4e2b14e02/src/graphql/inputs/MutationSignUpInput.ts#L12)
