[API Docs](/)

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

> **envConfig**: `Pick`\<`FastifyInstance`\[`"envConfig"`\], `"API_BASE_URL"` \| `"FRONTEND_URL"`\>

Defined in: src/graphql/context.ts:44

***

### jwt

> **jwt**: `object`

Defined in: src/graphql/context.ts:48

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

Defined in: src/graphql/context.ts:51

***

### minio

> **minio**: `FastifyInstance`\[`"minio"`\]

Defined in: src/graphql/context.ts:52

***

### notification?

> `optional` **notification**: `object`

Defined in: src/graphql/context.ts:57

Per-request notification helper. Implementations may enqueue notifications
for delivery and support flush() to perform delivery after transaction commit.

#### emitEventCreatedImmediate()?

> `optional` **emitEventCreatedImmediate**: (`payload`, `ctx`) => `Promise`\<`void`\>

##### Parameters

###### payload

###### creatorName

`string`

###### eventId

`string`

###### eventName

`string`

###### organizationId

`string`

###### organizationName

`string`

###### startDate

`string`

###### ctx

[`GraphQLContext`](GraphQLContext.md)

##### Returns

`Promise`\<`void`\>

#### enqueueEventCreated()

> **enqueueEventCreated**: (`payload`) => `void`

##### Parameters

###### payload

###### creatorName

`string`

###### eventId

`string`

###### eventName

`string`

###### organizationId

`string`

###### organizationName

`string`

###### startDate

`string`

##### Returns

`void`

#### enqueueSendEventInvite()

> **enqueueSendEventInvite**: (`payload`) => `void`

##### Parameters

###### payload

###### eventId?

`string`

###### eventName?

`string`

###### invitationToken

`string`

###### invitationUrl

`string`

###### inviteeEmail

`string`

###### inviteeName?

`string`

###### inviterId

`string`

###### organizationId

`string`

##### Returns

`void`

#### flush()

> **flush**: (`ctx`) => `Promise`\<`void`\>

##### Parameters

###### ctx

[`GraphQLContext`](GraphQLContext.md)

##### Returns

`Promise`\<`void`\>
