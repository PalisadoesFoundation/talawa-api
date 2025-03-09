[Admin Docs](/)

***

# Function: objects()

> **objects**(`instance`, `opts`): `Promise`\<`void`\>

Defined in: [src/routes/objects.ts:9](https://github.com/syedali237/talawa-api/blob/aa4e819f67def774740606c7a534dc013cdfe393/src/routes/objects.ts#L9)

This fastify route plugin is used to initialize a `/objects/:name` endpoint on the fastify server for clients to fetch objects from the minio server.

## Parameters

### instance

`FastifyInstance`\<`RawServerDefault`, `IncomingMessage`, `ServerResponse`\<`IncomingMessage`\>, `FastifyBaseLogger`, `TypeBoxTypeProvider`\>

### opts

`Record`

## Returns

`Promise`\<`void`\>
