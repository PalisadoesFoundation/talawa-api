[Admin Docs](/)

***

# Variable: mutationCreateUserInputSchema

> `const` **mutationCreateUserInputSchema**: `ZodObject`\<`extendShape`\<`Omit`\<\{ `emailAddress`: `ZodTypeAny`; `isEmailAddressVerified`: `ZodTypeAny`; `name`: `ZodTypeAny`; `passwordHash`: `ZodTypeAny`; `role`: `ZodTypeAny`; \}, `"id"` \| `"createdAt"` \| `"name"` \| `"avatarMimeType"` \| `"avatarName"` \| `"creatorId"` \| `"emailAddress"` \| `"isEmailAddressVerified"` \| `"passwordHash"` \| `"role"` \| `"updatedAt"` \| `"updaterId"`\>, \{ `avatar`: `ZodOptional`\<`ZodNullable`\<`ZodType`\<`Promise`\<`FileUpload`\>, `Promise`\<`FileUpload`\>\>\>\>; `password`: `ZodString`; \}\>, `"strip"`, \{ `avatar`: `Promise`\<`FileUpload`\>; `password`: `string`; \}, \{ `avatar`: `Promise`\<`FileUpload`\>; `password`: `string`; \}\>

## Defined in

[src/graphql/inputs/MutationCreateUserInput.ts:13](https://github.com/NishantSinghhhhh/talawa-api/blob/05ae6a4794762096d917a90a3af0db22b7c47392/src/graphql/inputs/MutationCreateUserInput.ts#L13)
