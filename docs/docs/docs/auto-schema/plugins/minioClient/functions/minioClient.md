[Admin Docs](/)

***

# Function: minioClient()

> **minioClient**(`fastify`): `Promise`\<`void`\>

Defined in: [src/plugins/minioClient.ts:26](https://github.com/syedali237/talawa-api/blob/98bc58250f2ff99b91cd3ae158cc2ad171f7d560/src/plugins/minioClient.ts#L26)

Integrates the talawa minio bucket name and a minio client instance on the namespaces `minio.bucketName` and `minio.client` respectively on the global fastify instance.

## Parameters

### fastify

`FastifyInstance`\<`RawServerDefault`, `IncomingMessage`, `ServerResponse`\<`IncomingMessage`\>, `FastifyBaseLogger`, `FastifyTypeProviderDefault`\>

## Returns

`Promise`\<`void`\>

## Example

```ts
import minioClientPlugin from "~src/plugins/minioClient";

fastify.register(minioClientPlugin, {});
const buckets = await fastify.minio.client.listBuckets();
```
