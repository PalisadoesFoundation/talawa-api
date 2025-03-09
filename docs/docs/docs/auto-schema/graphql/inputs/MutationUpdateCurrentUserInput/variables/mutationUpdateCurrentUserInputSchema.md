[Admin Docs](/)

***

# Variable: mutationUpdateCurrentUserInputSchema

> `const` **mutationUpdateCurrentUserInputSchema**: `ZodEffects`\<`ZodObject`\<`extendShape`\<`Omit`\<\{ `emailAddress`: `ZodTypeAny`; `isEmailAddressVerified`: `ZodTypeAny`; `name`: `ZodTypeAny`; `passwordHash`: `ZodTypeAny`; `role`: `ZodTypeAny`; \}, `"id"` \| `"createdAt"` \| `"name"` \| `"avatarMimeType"` \| `"avatarName"` \| `"creatorId"` \| `"emailAddress"` \| `"isEmailAddressVerified"` \| `"passwordHash"` \| `"role"` \| `"updatedAt"` \| `"updaterId"`\>, \{ `avatar`: `ZodOptional`\<`ZodNullable`\<`ZodType`\<`Promise`\<`FileUpload`\>, `ZodTypeDef`, `Promise`\<`FileUpload`\>\>\>\>; `emailAddress`: `ZodOptional`\<`ZodTypeAny`\>; `name`: `ZodOptional`\<`ZodTypeAny`\>; `password`: `ZodOptional`\<`ZodString`\>; \}\>, `"strip"`, `ZodTypeAny`, \{ `avatar`: `Promise`\<`FileUpload`\>; `emailAddress`: `any`; `name`: `any`; `password`: `string`; \}, \{ `avatar`: `Promise`\<`FileUpload`\>; `emailAddress`: `any`; `name`: `any`; `password`: `string`; \}\>, \{ `avatar`: `Promise`\<`FileUpload`\>; `emailAddress`: `any`; `name`: `any`; `password`: `string`; \}, \{ `avatar`: `Promise`\<`FileUpload`\>; `emailAddress`: `any`; `name`: `any`; `password`: `string`; \}\>

Defined in: [src/graphql/inputs/MutationUpdateCurrentUserInput.ts:12](https://github.com/syedali237/talawa-api/blob/691786dc98e76819737c41ef0af34983792105fd/src/graphql/inputs/MutationUpdateCurrentUserInput.ts#L12)
