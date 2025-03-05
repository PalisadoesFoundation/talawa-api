[Admin Docs](/)

***

# Function: minioClient()

> **minioClient**(`fastify`): `Promise`\<`void`\>

Integrates the talawa minio bucket name and a minio client instance on the namespaces `minio.bucketName` and `minio.client` respectively on the global fastify instance.

## Parameters

### fastify

`FastifyInstance`\<`IncomingMessage`, `ServerResponse`\>

## Returns

`Promise`\<`void`\>

## Example

```ts
import minioClientPlugin from "~src/plugins/minioClient";

fastify.register(minioClientPlugin, {});
const buckets = await fastify.minio.client.listBuckets();
```

## Defined in

[src/plugins/minioClient.ts:26](https://github.com/NishantSinghhhhh/talawa-api/blob/ff0f1d6ae21d3428519b64e42fe3bfdff573cb6e/src/plugins/minioClient.ts#L26)
