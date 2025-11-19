[API Docs](/)

***

# Class: NotificationService

Defined in: src/services/notification/NotificationService.ts:40

Thin per-request notification service. By default it collects notifications in-memory
during the request and flushes them (delegates to the existing event bus) when
`flush()` is called. This preserves existing behavior while making it easy to
change the delivery strategy later (DB-backed queue, background worker, etc.).

## Constructors

### Constructor

> **new NotificationService**(): `NotificationService`

#### Returns

`NotificationService`

## Methods

### emitEventCreatedImmediate()

> **emitEventCreatedImmediate**(`payload`, `ctx`): `Promise`\<`void`\>

Defined in: src/services/notification/NotificationService.ts:72

Synchronous immediate emit (delegates directly). Useful when you want to
bypass queuing.

#### Parameters

##### payload

[`EventCreatedPayload`](../type-aliases/EventCreatedPayload.md)

##### ctx

[`GraphQLContext`](../../../../graphql/context/type-aliases/GraphQLContext.md)

#### Returns

`Promise`\<`void`\>

***

### emitSendEventInviteImmediate()

> **emitSendEventInviteImmediate**(`payload`, `ctx`): `Promise`\<`void`\>

Defined in: src/services/notification/NotificationService.ts:79

#### Parameters

##### payload

[`SendEventInvitePayload`](../type-aliases/SendEventInvitePayload.md)

##### ctx

[`GraphQLContext`](../../../../graphql/context/type-aliases/GraphQLContext.md)

#### Returns

`Promise`\<`void`\>

***

### enqueueEventCreated()

> **enqueueEventCreated**(`payload`): `void`

Defined in: src/services/notification/NotificationService.ts:43

#### Parameters

##### payload

[`EventCreatedPayload`](../type-aliases/EventCreatedPayload.md)

#### Returns

`void`

***

### enqueueSendEventInvite()

> **enqueueSendEventInvite**(`payload`): `void`

Defined in: src/services/notification/NotificationService.ts:47

#### Parameters

##### payload

[`SendEventInvitePayload`](../type-aliases/SendEventInvitePayload.md)

#### Returns

`void`

***

### flush()

> **flush**(`ctx`): `Promise`\<`void`\>

Defined in: src/services/notification/NotificationService.ts:55

Flush queued notifications by delegating to the global event bus. Accepts the
full GraphQL context since the event bus / notification engine require it.

#### Parameters

##### ctx

[`GraphQLContext`](../../../../graphql/context/type-aliases/GraphQLContext.md)

#### Returns

`Promise`\<`void`\>
