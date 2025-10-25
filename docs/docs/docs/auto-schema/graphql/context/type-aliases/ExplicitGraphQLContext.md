[Admin Docs](/)

***

# Type Alias: ExplicitGraphQLContext

> **ExplicitGraphQLContext** = `object`

Defined in: [src/graphql/context.ts:41](https://github.com/Sourya07/talawa-api/blob/583d62db9438de398bb9012a4a2617e2cb268b08/src/graphql/context.ts#L41)

Type of the transport protocol agnostic explicit context object that is merged with the implcit mercurius context object and passed to the graphql resolvers each time they resolve a graphql operation at runtime.

## Properties

### currentClient

> **currentClient**: [`CurrentClient`](CurrentClient.md)

Defined in: [src/graphql/context.ts:42](https://github.com/Sourya07/talawa-api/blob/583d62db9438de398bb9012a4a2617e2cb268b08/src/graphql/context.ts#L42)

***

### drizzleClient

> **drizzleClient**: `FastifyInstance`\[`"drizzleClient"`\]

Defined in: [src/graphql/context.ts:43](https://github.com/Sourya07/talawa-api/blob/583d62db9438de398bb9012a4a2617e2cb268b08/src/graphql/context.ts#L43)

***

### envConfig

> **envConfig**: `Pick`\<`FastifyInstance`\[`"envConfig"`\], `"API_BASE_URL"`\>

Defined in: [src/graphql/context.ts:44](https://github.com/Sourya07/talawa-api/blob/583d62db9438de398bb9012a4a2617e2cb268b08/src/graphql/context.ts#L44)

***

### jwt

> **jwt**: `object`

Defined in: [src/graphql/context.ts:45](https://github.com/Sourya07/talawa-api/blob/583d62db9438de398bb9012a4a2617e2cb268b08/src/graphql/context.ts#L45)

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

Defined in: [src/graphql/context.ts:48](https://github.com/Sourya07/talawa-api/blob/583d62db9438de398bb9012a4a2617e2cb268b08/src/graphql/context.ts#L48)

***

### minio

> **minio**: `FastifyInstance`\[`"minio"`\]

Defined in: [src/graphql/context.ts:49](https://github.com/Sourya07/talawa-api/blob/583d62db9438de398bb9012a4a2617e2cb268b08/src/graphql/context.ts#L49)
