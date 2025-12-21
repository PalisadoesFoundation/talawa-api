[API Docs](/)

***

# Type Alias: ExplicitGraphQLContext

> **ExplicitGraphQLContext** = `object`

Defined in: [src/graphql/context.ts:41](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/context.ts#L41)

Type of the transport protocol agnostic explicit context object that is merged with the implcit mercurius context object and passed to the graphql resolvers each time they resolve a graphql operation at runtime.

## Properties

### currentClient

> **currentClient**: [`CurrentClient`](CurrentClient.md)

Defined in: [src/graphql/context.ts:42](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/context.ts#L42)

***

### drizzleClient

> **drizzleClient**: `FastifyInstance`\[`"drizzleClient"`\]

Defined in: [src/graphql/context.ts:43](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/context.ts#L43)

***

### envConfig

> **envConfig**: `Pick`\<`FastifyInstance`\[`"envConfig"`\], `"API_ACCOUNT_LOCKOUT_DURATION_MS"` \| `"API_ACCOUNT_LOCKOUT_THRESHOLD"` \| `"API_BASE_URL"` \| `"API_REFRESH_TOKEN_EXPIRES_IN"` \| `"FRONTEND_URL"`\>

Defined in: [src/graphql/context.ts:44](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/context.ts#L44)

***

### jwt

> **jwt**: `object`

Defined in: [src/graphql/context.ts:52](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/context.ts#L52)

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

Defined in: [src/graphql/context.ts:55](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/context.ts#L55)

***

### minio

> **minio**: `FastifyInstance`\[`"minio"`\]

Defined in: [src/graphql/context.ts:56](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/context.ts#L56)

***

### notification?

> `optional` **notification**: `object`

Defined in: [src/graphql/context.ts:61](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/context.ts#L61)

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
