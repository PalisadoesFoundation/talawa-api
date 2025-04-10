[Admin Docs](/)

***

# Variable: mutationSignUpInputSchema

> `const` **mutationSignUpInputSchema**: `ZodObject`\<`extendShape`\<`Omit`\<\{ `emailAddress`: `ZodTypeAny`; `name`: `ZodTypeAny`; \}, `"id"` \| `"name"` \| `"avatarMimeType"` \| `"avatarName"` \| `"createdAt"` \| `"creatorId"` \| `"emailAddress"` \| `"isEmailAddressVerified"` \| `"passwordHash"` \| `"role"` \| `"updatedAt"` \| `"updaterId"`\>, \{ `avatar`: `ZodOptional`\<`ZodNullable`\<`ZodType`\<`Promise`\<`FileUpload`\>, `ZodTypeDef`, `Promise`\<`FileUpload`\>\>\>\>; `password`: `ZodString`; `selectedOrganization`: `ZodString`; \}\>, `"strip"`, `ZodTypeAny`, \{ `avatar`: `Promise`\<`FileUpload`\>; `password`: `string`; `selectedOrganization`: `string`; \}, \{ `avatar`: `Promise`\<`FileUpload`\>; `password`: `string`; `selectedOrganization`: `string`; \}\>

Defined in: [src/graphql/inputs/MutationSignUpInput.ts:12](https://github.com/PurnenduMIshra129th/talawa-api/blob/6dd1cb0af1891b88aa61534ec8a6180536cd264f/src/graphql/inputs/MutationSignUpInput.ts#L12)
