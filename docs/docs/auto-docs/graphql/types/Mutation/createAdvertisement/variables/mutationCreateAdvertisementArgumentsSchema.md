[**talawa-api**](../../../../../README.md)

***

# Variable: mutationCreateAdvertisementArgumentsSchema

> `const` **mutationCreateAdvertisementArgumentsSchema**: `ZodObject`\<\{ `input`: `ZodObject`\<\{ `attachments`: `ZodOptional`\<`ZodArray`\<`ZodObject`\<\{ `fileHash`: `ZodString`; `mimeType`: `ZodEnum`\<\{ `image/avif`: `"image/avif"`; `image/jpeg`: `"image/jpeg"`; `image/png`: `"image/png"`; `image/webp`: `"image/webp"`; `video/mp4`: `"video/mp4"`; `video/quicktime`: `"video/quicktime"`; `video/webm`: `"video/webm"`; \}\>; `name`: `ZodString`; `objectName`: `ZodString`; \}, `$strip`\>\>\>; `description`: `ZodNullable`\<`ZodOptional`\<`ZodString`\>\>; `endAt`: `ZodDate`; `name`: `ZodString`; `organizationId`: `ZodUUID`; `startAt`: `ZodDate`; `type`: `ZodString`; \}, \{ \}\>; \}, `$strip`\>

Defined in: [src/graphql/types/Mutation/createAdvertisement.ts:13](https://github.com/singhaditya73/talawa-api/blob/0e11f9efaf3110cae96d9bcec23fad73db6e3b03/src/graphql/types/Mutation/createAdvertisement.ts#L13)
