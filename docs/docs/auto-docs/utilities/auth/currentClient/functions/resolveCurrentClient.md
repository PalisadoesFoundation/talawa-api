[API Docs](/)

***

# Function: resolveCurrentClient()

> **resolveCurrentClient**(`fastify`, `request`): `Promise`\<[`CurrentClient`](../../../../graphql/context/type-aliases/CurrentClient.md)\>

Defined in: [src/utilities/auth/currentClient.ts:18](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/auth/currentClient.ts#L18)

Resolves the current client from the request using the same dual-token order
as GraphQL context: Bearer legacy → Bearer REST → Cookie legacy → Cookie REST.
If no valid user id is produced, returns unauthenticated.
Used by both createContext and the preExecution rate-limit hook.

## Parameters

### fastify

`FastifyInstance`

### request

`FastifyRequest`

## Returns

`Promise`\<[`CurrentClient`](../../../../graphql/context/type-aliases/CurrentClient.md)\>
