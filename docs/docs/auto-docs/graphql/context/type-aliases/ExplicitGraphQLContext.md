[API Docs](/)

***

# Type Alias: ExplicitGraphQLContext

> **ExplicitGraphQLContext** = `object`

Defined in: [src/graphql/context.ts:41](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/context.ts#L41)

Type of the transport protocol agnostic explicit context object that is merged with the implcit mercurius context object and passed to the graphql resolvers each time they resolve a graphql operation at runtime.

## Properties

### cookie?

> `optional` **cookie**: `object`

Defined in: [src/graphql/context.ts:63](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/context.ts#L63)

Cookie helper for setting HTTP-Only authentication cookies.
Only available for HTTP requests (not WebSocket subscriptions).

#### clearAuthCookies()

> **clearAuthCookies**: () => `void`

Clears both authentication cookies (for logout).

##### Returns

`void`

#### getRefreshToken()

> **getRefreshToken**: () => `string` \| `undefined`

Gets the refresh token from cookies if present.

##### Returns

`string` \| `undefined`

#### setAuthCookies()

> **setAuthCookies**: (`accessToken`, `refreshToken`) => `void`

Sets both access token and refresh token as HTTP-Only cookies.

##### Parameters

###### accessToken

`string`

The JWT access token

###### refreshToken

`string`

The refresh token

##### Returns

`void`

***

### currentClient

> **currentClient**: [`CurrentClient`](CurrentClient.md)

Defined in: [src/graphql/context.ts:42](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/context.ts#L42)

***

### drizzleClient

> **drizzleClient**: `FastifyInstance`\[`"drizzleClient"`\]

Defined in: [src/graphql/context.ts:43](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/context.ts#L43)

***

### envConfig

> **envConfig**: `Pick`\<`FastifyInstance`\[`"envConfig"`\], `"API_ACCOUNT_LOCKOUT_DURATION_MS"` \| `"API_ACCOUNT_LOCKOUT_THRESHOLD"` \| `"API_BASE_URL"` \| `"API_REFRESH_TOKEN_EXPIRES_IN"` \| `"API_PASSWORD_RESET_TOKEN_EXPIRES_IN"` \| `"API_COOKIE_DOMAIN"` \| `"API_IS_SECURE_COOKIES"` \| `"API_JWT_EXPIRES_IN"` \| `"FRONTEND_URL"`\>

Defined in: [src/graphql/context.ts:44](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/context.ts#L44)

***

### jwt

> **jwt**: `object`

Defined in: [src/graphql/context.ts:56](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/context.ts#L56)

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

Defined in: [src/graphql/context.ts:79](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/context.ts#L79)

***

### minio

> **minio**: `FastifyInstance`\[`"minio"`\]

Defined in: [src/graphql/context.ts:80](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/context.ts#L80)

***

### notification?

> `optional` **notification**: `object`

Defined in: [src/graphql/context.ts:85](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/context.ts#L85)

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
