[API Docs](/)

***

# Variable: FileMetadataInput

> `const` **FileMetadataInput**: `InputObjectRef`\<`ExtendDefaultTypes`\<\{ `Context`: [`GraphQLContext`](../../../context/type-aliases/GraphQLContext.md); `Scalars`: [`CustomScalars`](../../../scalars/type-aliases/CustomScalars.md); \}\>, \{ `fileHash`: `string`; `mimeType`: `NonNullable`\<`"image/avif"` \| `"image/jpeg"` \| `"image/png"` \| `"image/webp"` \| `"video/mp4"` \| `"video/webm"` \| `"video/quicktime"`\>; `name`: `string`; `objectName`: `string`; \}\>

Defined in: [src/graphql/inputs/FileMetadataInput.ts:39](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/inputs/FileMetadataInput.ts#L39)

GraphQL input type for file metadata submitted after MinIO presigned URL upload.
