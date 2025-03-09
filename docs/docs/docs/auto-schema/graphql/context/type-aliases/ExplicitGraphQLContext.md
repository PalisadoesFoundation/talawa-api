[Admin Docs](/)

***

# Type Alias: ExplicitGraphQLContext

> **ExplicitGraphQLContext**: `object`

Defined in: [src/graphql/context.ts:41](https://github.com/PratapRathi/talawa-api/blob/8be1a1231af103d298d6621405c956dc45d3a73a/src/graphql/context.ts#L41)

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
