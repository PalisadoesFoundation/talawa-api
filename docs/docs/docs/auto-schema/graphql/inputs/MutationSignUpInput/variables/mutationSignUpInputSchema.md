[Admin Docs](/)

***

# Variable: mutationSignUpInputSchema

> `const` **mutationSignUpInputSchema**: `ZodObject`\<`extendShape`\<`Omit`\<\{ `emailAddress`: `ZodTypeAny`; `name`: `ZodTypeAny`; \}, `"id"` \| `"name"` \| `"avatarMimeType"` \| `"avatarName"` \| `"createdAt"` \| `"creatorId"` \| `"emailAddress"` \| `"isEmailAddressVerified"` \| `"passwordHash"` \| `"role"` \| `"updatedAt"` \| `"updaterId"`\>, \{ `avatar`: `ZodOptional`\<`ZodNullable`\<`ZodType`\<`Promise`\<`FileUpload`\>, `ZodTypeDef`, `Promise`\<`FileUpload`\>\>\>\>; `password`: `ZodString`; `selectedOrganization`: `ZodString`; \}\>, `"strip"`, `ZodTypeAny`, \{ `avatar`: `Promise`\<`FileUpload`\>; `password`: `string`; `selectedOrganization`: `string`; \}, \{ `avatar`: `Promise`\<`FileUpload`\>; `password`: `string`; `selectedOrganization`: `string`; \}\>

Defined in: [src/graphql/inputs/MutationSignUpInput.ts:12](https://github.com/PurnenduMIshra129th/talawa-api/blob/4d9be178e903c8bd2778a802379c92eee9a2afdf/src/graphql/inputs/MutationSignUpInput.ts#L12)
