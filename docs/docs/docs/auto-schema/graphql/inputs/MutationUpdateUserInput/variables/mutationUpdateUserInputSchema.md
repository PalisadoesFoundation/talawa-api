[Admin Docs](/)

***

# Variable: mutationUpdateUserInputSchema

> `const` **mutationUpdateUserInputSchema**: `ZodEffects`\<`ZodObject`\<`extendShape`\<`Omit`\<\{ `emailAddress`: `ZodTypeAny`; `name`: `ZodTypeAny`; \}, `"id"` \| `"name"` \| `"avatarMimeType"` \| `"avatarName"` \| `"createdAt"` \| `"creatorId"` \| `"emailAddress"` \| `"passwordHash"` \| `"updatedAt"` \| `"updaterId"`\>, \{ `avatar`: `ZodOptional`\<`ZodNullable`\<`ZodType`\<`Promise`\<`FileUpload`\>, `ZodTypeDef`, `Promise`\<`FileUpload`\>\>\>\>; `emailAddress`: `ZodOptional`\<`ZodTypeAny`\>; `id`: `any`; `isEmailAddressVerified`: `any`; `name`: `ZodOptional`\<`ZodTypeAny`\>; `password`: `ZodOptional`\<`ZodString`\>; `role`: `any`; \}\>, `"strip"`, `ZodTypeAny`, \{ `[key: string]`: `any`;  `avatar`: `unknown`; `emailAddress`: `unknown`; `id`: `unknown`; `isEmailAddressVerified`: `unknown`; `name`: `unknown`; `password`: `unknown`; `role`: `unknown`; \}, \{ `[key: string]`: `any`;  `avatar`: `unknown`; `emailAddress`: `unknown`; `id`: `unknown`; `isEmailAddressVerified`: `unknown`; `name`: `unknown`; `password`: `unknown`; `role`: `unknown`; \}\>, \{ `[key: string]`: `any`;  `avatar`: `unknown`; `emailAddress`: `unknown`; `id`: `unknown`; `isEmailAddressVerified`: `unknown`; `name`: `unknown`; `password`: `unknown`; `role`: `unknown`; \}, \{ `[key: string]`: `any`;  `avatar`: `unknown`; `emailAddress`: `unknown`; `id`: `unknown`; `isEmailAddressVerified`: `unknown`; `name`: `unknown`; `password`: `unknown`; `role`: `unknown`; \}\>

Defined in: [src/graphql/inputs/MutationUpdateUserInput.ts:13](https://github.com/PalisadoesFoundation/talawa-api/blob/4f56a5331bd7a5f784e82913103662f37b427f3e/src/graphql/inputs/MutationUpdateUserInput.ts#L13)
