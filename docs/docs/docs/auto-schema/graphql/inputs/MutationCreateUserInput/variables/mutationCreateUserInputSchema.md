[Admin Docs](/)

***

# Variable: mutationCreateUserInputSchema

> `const` **mutationCreateUserInputSchema**: `ZodObject`\<`extendShape`\<`Omit`\<\{ `emailAddress`: `ZodTypeAny`; `isEmailAddressVerified`: `ZodTypeAny`; `name`: `ZodTypeAny`; `passwordHash`: `ZodTypeAny`; `role`: `ZodTypeAny`; \}, `"id"` \| `"createdAt"` \| `"name"` \| `"avatarMimeType"` \| `"avatarName"` \| `"creatorId"` \| `"emailAddress"` \| `"isEmailAddressVerified"` \| `"passwordHash"` \| `"role"` \| `"updatedAt"` \| `"updaterId"`\>, \{ `avatar`: `ZodOptional`\<`ZodNullable`\<`ZodType`\<`Promise`\<`FileUpload`\>, `ZodTypeDef`, `Promise`\<`FileUpload`\>\>\>\>; `password`: `ZodString`; \}\>, `"strip"`, `ZodTypeAny`, \{ `avatar`: `Promise`\<`FileUpload`\>; `password`: `string`; \}, \{ `avatar`: `Promise`\<`FileUpload`\>; `password`: `string`; \}\>

Defined in: [src/graphql/inputs/MutationCreateUserInput.ts:13](https://github.com/Suyash878/talawa-api/blob/dd80c416ddd46afdb07c628dc824194bc09930cc/src/graphql/inputs/MutationCreateUserInput.ts#L13)
