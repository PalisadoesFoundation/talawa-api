[**talawa-api**](../../../README.md)

***

# Type Alias: ExplicitGraphQLContext

> **ExplicitGraphQLContext** = `object`

Defined in: [src/graphql/context.ts:42](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/graphql/context.ts#L42)

Type of the transport protocol agnostic explicit context object that is merged with the implcit mercurius context object and passed to the graphql resolvers each time they resolve a graphql operation at runtime.

## Properties

### cookie?

> `optional` **cookie**: `object`

Defined in: [src/graphql/context.ts:75](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/graphql/context.ts#L75)

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

Defined in: [src/graphql/context.ts:43](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/graphql/context.ts#L43)

***

### dataloaders

> **dataloaders**: [`Dataloaders`](../../../utilities/dataloaders/type-aliases/Dataloaders.md)

Defined in: [src/graphql/context.ts:47](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/graphql/context.ts#L47)

Request-scoped DataLoaders for batching database queries.

***

### drizzleClient

> **drizzleClient**: `FastifyInstance`\[`"drizzleClient"`\]

Defined in: [src/graphql/context.ts:48](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/graphql/context.ts#L48)

***

### envConfig

> **envConfig**: `Pick`\<`FastifyInstance`\[`"envConfig"`\], `"API_ACCOUNT_LOCKOUT_DURATION_MS"` \| `"API_ACCOUNT_LOCKOUT_THRESHOLD"` \| `"API_BASE_URL"` \| `"API_COMMUNITY_NAME"` \| `"API_REFRESH_TOKEN_EXPIRES_IN"` \| `"API_PASSWORD_RESET_USER_TOKEN_EXPIRES_SECONDS"` \| `"API_PASSWORD_RESET_ADMIN_TOKEN_EXPIRES_SECONDS"` \| `"API_COOKIE_DOMAIN"` \| `"API_IS_SECURE_COOKIES"` \| `"API_JWT_EXPIRES_IN"` \| `"AWS_ACCESS_KEY_ID"` \| `"AWS_SECRET_ACCESS_KEY"` \| `"AWS_SES_REGION"` \| `"AWS_SES_FROM_EMAIL"` \| `"AWS_SES_FROM_NAME"` \| `"FRONTEND_URL"`\>

Defined in: [src/graphql/context.ts:49](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/graphql/context.ts#L49)

***

### jwt

> **jwt**: `object`

Defined in: [src/graphql/context.ts:68](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/graphql/context.ts#L68)

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

Defined in: [src/graphql/context.ts:91](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/graphql/context.ts#L91)

***

### minio

> **minio**: `FastifyInstance`\[`"minio"`\]

Defined in: [src/graphql/context.ts:92](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/graphql/context.ts#L92)

***

### notification?

> `optional` **notification**: `object`

Defined in: [src/graphql/context.ts:97](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/graphql/context.ts#L97)

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
