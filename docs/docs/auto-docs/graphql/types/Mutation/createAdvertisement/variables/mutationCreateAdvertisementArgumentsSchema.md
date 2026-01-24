[API Docs](/)

***

# Variable: mutationCreateAdvertisementArgumentsSchema

> `const` **mutationCreateAdvertisementArgumentsSchema**: `ZodObject`\<\{ `input`: `ZodPipe`\<`ZodObject`\<\{ `attachments`: `ZodOptional`\<`ZodArray`\<`ZodCustom`\<`Promise`\<`FileUpload`\>, `Promise`\<`FileUpload`\>\>\>\>; `description`: `ZodNullable`\<`ZodOptional`\<`ZodString`\>\>; `endAt`: `ZodDate`; `name`: `ZodString`; `organizationId`: `ZodUUID`; `startAt`: `ZodDate`; `type`: `ZodString`; \}, \{ \}\>, `ZodTransform`\<\{ `attachments`: `FileUpload` & `object`[] \| `undefined`; `description?`: `string` \| `null`; `endAt`: `Date`; `name`: `string`; `organizationId`: `string`; `startAt`: `Date`; `type`: `string`; \}, \{ `attachments?`: `Promise`\<`FileUpload`\>[]; `description?`: `string` \| `null`; `endAt`: `Date`; `name`: `string`; `organizationId`: `string`; `startAt`: `Date`; `type`: `string`; \}\>\>; \}, `$strip`\>

Defined in: [src/graphql/types/Mutation/createAdvertisement.ts:16](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/types/Mutation/createAdvertisement.ts#L16)
