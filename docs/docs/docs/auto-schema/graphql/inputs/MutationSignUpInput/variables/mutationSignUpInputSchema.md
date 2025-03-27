[Admin Docs](/)

***

# Variable: mutationSignUpInputSchema

> `const` **mutationSignUpInputSchema**: `ZodObject`\<`extendShape`\<`Omit`\<\{ `emailAddress`: `ZodTypeAny`; `isEmailAddressVerified`: `ZodTypeAny`; `name`: `ZodTypeAny`; `passwordHash`: `ZodTypeAny`; `role`: `ZodTypeAny`; \}, `"id"` \| `"name"` \| `"createdAt"` \| `"avatarMimeType"` \| `"avatarName"` \| `"creatorId"` \| `"emailAddress"` \| `"isEmailAddressVerified"` \| `"passwordHash"` \| `"role"` \| `"updatedAt"` \| `"updaterId"`\>, \{ `avatar`: `ZodOptional`\<`ZodNullable`\<`ZodType`\<`Promise`\<`FileUpload`\>, `ZodTypeDef`, `Promise`\<`FileUpload`\>\>\>\>; `password`: `ZodString`; \}\>, `"strip"`, `ZodTypeAny`, \{ `avatar`: `Promise`\<`FileUpload`\>; `password`: `string`; \}, \{ `avatar`: `Promise`\<`FileUpload`\>; `password`: `string`; \}\>

Defined in: [src/graphql/inputs/MutationSignUpInput.ts:12](https://github.com/hustlernik/talawa-api/blob/6321c91e956d2ee44b2bb9c22c1b40aa4687c9c2/src/graphql/inputs/MutationSignUpInput.ts#L12)
