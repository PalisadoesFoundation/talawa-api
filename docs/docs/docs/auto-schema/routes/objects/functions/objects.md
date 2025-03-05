[Admin Docs](/)

***

# Function: objects()

> **objects**(`instance`, `opts`): `Promise`\<`void`\>

Defined in: [src/routes/objects.ts:9](https://github.com/PalisadoesFoundation/talawa-api/blob/36e30b39ce897bdded5fea4859d9ae00485b5a4c/src/routes/objects.ts#L9)

This fastify route plugin is used to initialize a `/objects/:name` endpoint on the fastify server for clients to fetch objects from the minio server.

## Parameters

### instance

`FastifyInstance`\<`RawServerDefault`, `IncomingMessage`, `ServerResponse`\<`IncomingMessage`\>, `FastifyBaseLogger`, `TypeBoxTypeProvider`\>

### opts

`Record`

## Returns

`Promise`\<`void`\>
