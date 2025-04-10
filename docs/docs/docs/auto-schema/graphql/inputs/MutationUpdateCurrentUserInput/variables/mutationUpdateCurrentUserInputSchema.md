[Admin Docs](/)

***

# Variable: mutationUpdateCurrentUserInputSchema

> `const` **mutationUpdateCurrentUserInputSchema**: `ZodEffects`\<`ZodObject`\<`extendShape`\<`Omit`\<\{ `emailAddress`: `ZodTypeAny`; `name`: `ZodTypeAny`; \}, `"id"` \| `"name"` \| `"avatarMimeType"` \| `"avatarName"` \| `"createdAt"` \| `"creatorId"` \| `"emailAddress"` \| `"isEmailAddressVerified"` \| `"passwordHash"` \| `"role"` \| `"updatedAt"` \| `"updaterId"`\>, \{ `avatar`: `ZodOptional`\<`ZodNullable`\<`ZodType`\<`Promise`\<`FileUpload`\>, `ZodTypeDef`, `Promise`\<`FileUpload`\>\>\>\>; `emailAddress`: `ZodOptional`\<`ZodTypeAny`\>; `name`: `ZodOptional`\<`ZodTypeAny`\>; `password`: `ZodOptional`\<`ZodString`\>; \}\>, `"strip"`, `ZodTypeAny`, \{ `avatar`: `Promise`\<`FileUpload`\>; `emailAddress`: `any`; `name`: `any`; `password`: `string`; \}, \{ `avatar`: `Promise`\<`FileUpload`\>; `emailAddress`: `any`; `name`: `any`; `password`: `string`; \}\>, \{ `avatar`: `Promise`\<`FileUpload`\>; `emailAddress`: `any`; `name`: `any`; `password`: `string`; \}, \{ `avatar`: `Promise`\<`FileUpload`\>; `emailAddress`: `any`; `name`: `any`; `password`: `string`; \}\>

Defined in: [src/graphql/inputs/MutationUpdateCurrentUserInput.ts:12](https://github.com/PurnenduMIshra129th/talawa-api/blob/75f0e499b44e2c3bed70cf951ac8ac374317f43b/src/graphql/inputs/MutationUpdateCurrentUserInput.ts#L12)
