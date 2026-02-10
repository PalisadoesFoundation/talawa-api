[API Docs](/)

***

# Type Alias: ExplicitGraphQLContext

> **ExplicitGraphQLContext** = `object`

Defined in: [src/graphql/context.ts:47](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/context.ts#L47)

Type of the transport protocol agnostic explicit context object that is merged with the implcit mercurius context object and passed to the graphql resolvers each time they resolve a graphql operation at runtime.

## Properties

### cache

> **cache**: [`CacheService`](../../../services/caching/CacheService/interfaces/CacheService.md) \| `ReturnType`\<*typeof* [`metricsCacheProxy`](../../../services/metrics/metricsCacheProxy/functions/metricsCacheProxy.md)\>

Defined in: [src/graphql/context.ts:51](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/context.ts#L51)

Redis-backed cache service for caching entities and query results.

***

### cookie?

> `optional` **cookie**: `object`

Defined in: [src/graphql/context.ts:88](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/context.ts#L88)

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

Defined in: [src/graphql/context.ts:52](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/context.ts#L52)

***

### dataloaders

> **dataloaders**: [`Dataloaders`](../../../utilities/dataloaders/type-aliases/Dataloaders.md)

Defined in: [src/graphql/context.ts:56](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/context.ts#L56)

Request-scoped DataLoaders for batching database queries.

***

### drizzleClient

> **drizzleClient**: `FastifyInstance`\[`"drizzleClient"`\]

Defined in: [src/graphql/context.ts:57](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/context.ts#L57)

***

### envConfig

> **envConfig**: `Pick`\<`FastifyInstance`\[`"envConfig"`\], `"API_ACCOUNT_LOCKOUT_DURATION_MS"` \| `"API_ACCOUNT_LOCKOUT_THRESHOLD"` \| `"API_BASE_URL"` \| `"API_COMMUNITY_NAME"` \| `"API_REFRESH_TOKEN_EXPIRES_IN"` \| `"API_PASSWORD_RESET_USER_TOKEN_EXPIRES_SECONDS"` \| `"API_PASSWORD_RESET_ADMIN_TOKEN_EXPIRES_SECONDS"` \| `"API_EMAIL_VERIFICATION_TOKEN_EXPIRES_SECONDS"` \| `"API_EMAIL_VERIFICATION_TOKEN_HMAC_SECRET"` \| `"API_COOKIE_DOMAIN"` \| `"API_IS_SECURE_COOKIES"` \| `"API_JWT_EXPIRES_IN"` \| `"AWS_ACCESS_KEY_ID"` \| `"AWS_SECRET_ACCESS_KEY"` \| `"AWS_SES_REGION"` \| `"AWS_SES_FROM_EMAIL"` \| `"AWS_SES_FROM_NAME"` \| `"FRONTEND_URL"` \| `"RECAPTCHA_SECRET_KEY"` \| `"RECAPTCHA_SCORE_THRESHOLD"`\>

Defined in: [src/graphql/context.ts:58](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/context.ts#L58)

***

### jwt

> **jwt**: `object`

Defined in: [src/graphql/context.ts:81](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/context.ts#L81)

#### sign()

> **sign**: (`payload`) => `string`

##### Parameters

###### payload

[`ExplicitAuthenticationTokenPayload`](ExplicitAuthenticationTokenPayload.md)

##### Returns

`string`

***

### log

> **log**: [`AppLogger`](../../../utilities/logging/logger/type-aliases/AppLogger.md)

Defined in: [src/graphql/context.ts:104](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/context.ts#L104)

***

### minio

> **minio**: `FastifyInstance`\[`"minio"`\]

Defined in: [src/graphql/context.ts:105](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/context.ts#L105)

***

### notification?

> `optional` **notification**: `object`

Defined in: [src/graphql/context.ts:114](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/context.ts#L114)

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

***

### oauthProviderRegistry?

> `optional` **oauthProviderRegistry**: [`OAuthProviderRegistry`](../../../utilities/auth/oauth/OAuthProviderRegistry/classes/OAuthProviderRegistry.md)

Defined in: [src/graphql/context.ts:109](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/context.ts#L109)

OAuth provider registry for accessing configured OAuth providers.

***

### perf?

> `optional` **perf**: [`PerformanceTracker`](../../../utilities/metrics/performanceTracker/interfaces/PerformanceTracker.md)

Defined in: [src/graphql/context.ts:151](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/context.ts#L151)

Request-scoped performance tracker for monitoring operation durations,
cache behavior (hits/misses), and GraphQL complexity scores.
Available in all GraphQL contexts (HTTP and WebSocket).
