[Admin Docs](/)

***

# Type Alias: ExplicitGraphQLContext

> **ExplicitGraphQLContext** = `object`

Defined in: src/graphql/context.ts:41

Type of the transport protocol agnostic explicit context object that is merged with the implcit mercurius context object and passed to the graphql resolvers each time they resolve a graphql operation at runtime.

## Properties

### currentClient

> **currentClient**: [`CurrentClient`](CurrentClient.md)

Defined in: src/graphql/context.ts:42

***

### drizzleClient

> **drizzleClient**: `FastifyInstance`\[`"drizzleClient"`\]

Defined in: src/graphql/context.ts:43

***

### envConfig

> **envConfig**: `Pick`\<`FastifyInstance`\[`"envConfig"`\], `"API_BASE_URL"`\>

Defined in: src/graphql/context.ts:44

***

### jwt

> **jwt**: `object`

Defined in: src/graphql/context.ts:45

#### sign()

> **sign**: (`payload`) => `string`

##### Parameters

###### payload

[`ExplicitAuthenticationTokenPayload`](ExplicitAuthenticationTokenPayload.md)

##### Returns

`string`

***

### log

> **log**: `FastifyInstance`\[`"log"`\]

Defined in: src/graphql/context.ts:48

***

### minio

> **minio**: `FastifyInstance`\[`"minio"`\]

Defined in: src/graphql/context.ts:49
