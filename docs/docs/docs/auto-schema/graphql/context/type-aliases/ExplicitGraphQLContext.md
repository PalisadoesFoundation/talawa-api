[Admin Docs](/)

***

# Type Alias: ExplicitGraphQLContext

> **ExplicitGraphQLContext**: `object`

<<<<<<< HEAD
=======
Defined in: [src/graphql/context.ts:41](https://github.com/PalisadoesFoundation/talawa-api/blob/37e2d6abe1cabaa02f97a3c6c418b81e8fcb5a13/src/graphql/context.ts#L41)

>>>>>>> develop-postgres
Type of the transport protocol agnostic explicit context object that is merged with the implcit mercurius context object and passed to the graphql resolvers each time they resolve a graphql operation at runtime.

## Type declaration

### currentClient

> **currentClient**: [`CurrentClient`](CurrentClient.md)

### drizzleClient

> **drizzleClient**: `FastifyInstance`\[`"drizzleClient"`\]

### envConfig

> **envConfig**: `Pick`\<`FastifyInstance`\[`"envConfig"`\], `"API_BASE_URL"`\>

### jwt

> **jwt**: `object`

#### jwt.sign()

> **sign**: (`payload`) => `string`

##### Parameters

###### payload

[`ExplicitAuthenticationTokenPayload`](ExplicitAuthenticationTokenPayload.md)

##### Returns

`string`

### log

> **log**: `FastifyInstance`\[`"log"`\]

### minio

> **minio**: `FastifyInstance`\[`"minio"`\]

## Defined in

[src/graphql/context.ts:41](https://github.com/NishantSinghhhhh/talawa-api/blob/ff0f1d6ae21d3428519b64e42fe3bfdff573cb6e/src/graphql/context.ts#L41)
