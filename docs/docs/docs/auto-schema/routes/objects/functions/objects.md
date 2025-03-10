[Admin Docs](/)

***

# Function: objects()

> **objects**(`instance`, `opts`): `Promise`\<`void`\>

Defined in: [src/routes/objects.ts:9](https://github.com/PratapRathi/talawa-api/blob/8c6154f4daaa502448d207545feda14b4d146e99/src/routes/objects.ts#L9)

This fastify route plugin is used to initialize a `/objects/:name` endpoint on the fastify server for clients to fetch objects from the minio server.

## Parameters

### instance

`FastifyInstance`\<`RawServerDefault`, `IncomingMessage`, `ServerResponse`\<`IncomingMessage`\>, `FastifyBaseLogger`, `TypeBoxTypeProvider`\>

### opts

`Record`

## Returns

`Promise`\<`void`\>
