[Admin Docs](/)

***

# Variable: mutationUpdateCurrentUserInputSchema

> `const` **mutationUpdateCurrentUserInputSchema**: `ZodEffects`\<`ZodObject`\<`extendShape`\<`Omit`\<\{ `emailAddress`: `ZodTypeAny`; `isEmailAddressVerified`: `ZodTypeAny`; `name`: `ZodTypeAny`; `passwordHash`: `ZodTypeAny`; `role`: `ZodTypeAny`; \}, `"id"` \| `"createdAt"` \| `"name"` \| `"avatarMimeType"` \| `"avatarName"` \| `"creatorId"` \| `"emailAddress"` \| `"isEmailAddressVerified"` \| `"passwordHash"` \| `"role"` \| `"updatedAt"` \| `"updaterId"`\>, \{ `avatar`: `ZodOptional`\<`ZodNullable`\<`ZodType`\<`Promise`\<`FileUpload`\>, `ZodTypeDef`, `Promise`\<`FileUpload`\>\>\>\>; `emailAddress`: `ZodOptional`\<`ZodTypeAny`\>; `name`: `ZodOptional`\<`ZodTypeAny`\>; `password`: `ZodOptional`\<`ZodString`\>; \}\>, `"strip"`, `ZodTypeAny`, \{ `avatar`: `Promise`\<`FileUpload`\>; `emailAddress`: `any`; `name`: `any`; `password`: `string`; \}, \{ `avatar`: `Promise`\<`FileUpload`\>; `emailAddress`: `any`; `name`: `any`; `password`: `string`; \}\>, \{ `avatar`: `Promise`\<`FileUpload`\>; `emailAddress`: `any`; `name`: `any`; `password`: `string`; \}, \{ `avatar`: `Promise`\<`FileUpload`\>; `emailAddress`: `any`; `name`: `any`; `password`: `string`; \}\>

Defined in: [src/graphql/inputs/MutationUpdateCurrentUserInput.ts:12](https://github.com/PalisadoesFoundation/talawa-api/blob/720213b8973f1ef622d2c99f376ffc6c960847d1/src/graphql/inputs/MutationUpdateCurrentUserInput.ts#L12)
