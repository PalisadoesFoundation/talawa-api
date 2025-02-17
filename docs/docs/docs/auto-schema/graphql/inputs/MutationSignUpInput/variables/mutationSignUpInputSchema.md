[Admin Docs](/)

***

# Variable: mutationSignUpInputSchema

> `const` **mutationSignUpInputSchema**: `ZodObject`\<`extendShape`\<`Omit`\<\{ `emailAddress`: `ZodTypeAny`; `isEmailAddressVerified`: `ZodTypeAny`; `name`: `ZodTypeAny`; `passwordHash`: `ZodTypeAny`; `role`: `ZodTypeAny`; \}, `"id"` \| `"createdAt"` \| `"name"` \| `"avatarMimeType"` \| `"avatarName"` \| `"creatorId"` \| `"emailAddress"` \| `"isEmailAddressVerified"` \| `"passwordHash"` \| `"role"` \| `"updatedAt"` \| `"updaterId"`\>, \{ `avatar`: `ZodOptional`\<`ZodNullable`\<`ZodType`\<`Promise`\<`FileUpload`\>, `ZodTypeDef`, `Promise`\<`FileUpload`\>\>\>\>; `password`: `ZodString`; \}\>, `"strip"`, `ZodTypeAny`, \{ `avatar`: `Promise`\<`FileUpload`\>; `password`: `string`; \}, \{ `avatar`: `Promise`\<`FileUpload`\>; `password`: `string`; \}\>

Defined in: [src/graphql/inputs/MutationSignUpInput.ts:12](https://github.com/Suyash878/talawa-api/blob/05d9dfc8d9c5928ef559c72f2ab0492d0dbbb48c/src/graphql/inputs/MutationSignUpInput.ts#L12)
