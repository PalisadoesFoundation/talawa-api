[API Docs](/)

***

# Function: warmOrganizations()

> **warmOrganizations**(`server`): `Promise`\<`void`\>

Defined in: [src/services/caching/warming.ts:11](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/caching/warming.ts#L11)

Warms the organization cache by loading top N organizations by member count.

## Parameters

### server

`FastifyInstance`

The Fastify server instance.

## Returns

`Promise`\<`void`\>
