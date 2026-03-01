[API Docs](/)

***

# Class: NotificationEventBus

Defined in: [src/graphql/types/Notification/EventBus/eventBus.ts:9](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/types/Notification/EventBus/eventBus.ts#L9)

## Extends

- `EventEmitter`

## Constructors

### Constructor

> **new NotificationEventBus**(`options?`): `NotificationEventBus`

Defined in: node\_modules/.pnpm/@types+node@22.19.9/node\_modules/@types/node/events.d.ts:101

#### Parameters

##### options?

`EventEmitterOptions`

#### Returns

`NotificationEventBus`

#### Inherited from

`EventEmitter.constructor`

## Methods

### emitEventCreated()

> **emitEventCreated**(`data`, `ctx`): `Promise`\<`void`\>

Defined in: [src/graphql/types/Notification/EventBus/eventBus.ts:115](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/types/Notification/EventBus/eventBus.ts#L115)

#### Parameters

##### data

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

##### ctx

[`GraphQLContext`](../../../../../context/type-aliases/GraphQLContext.md)

#### Returns

`Promise`\<`void`\>

***

### emitFundCampaignCreated()

> **emitFundCampaignCreated**(`data`, `ctx`): `Promise`\<`void`\>

Defined in: [src/graphql/types/Notification/EventBus/eventBus.ts:365](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/types/Notification/EventBus/eventBus.ts#L365)

#### Parameters

##### data

###### campaignId

`string`

###### campaignName

`string`

###### creatorName

`string`

###### currencyCode

`string`

###### fundName

`string`

###### goalAmount

`string`

###### organizationId

`string`

###### organizationName

`string`

##### ctx

[`GraphQLContext`](../../../../../context/type-aliases/GraphQLContext.md)

#### Returns

`Promise`\<`void`\>

***

### emitFundCampaignPledgeCreated()

> **emitFundCampaignPledgeCreated**(`data`, `ctx`): `Promise`\<`void`\>

Defined in: [src/graphql/types/Notification/EventBus/eventBus.ts:413](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/types/Notification/EventBus/eventBus.ts#L413)

#### Parameters

##### data

###### amount

`string`

###### campaignName

`string`

###### currencyCode

`string`

###### organizationId

`string`

###### organizationName

`string`

###### pledgeId

`string`

###### pledgerName

`string`

##### ctx

[`GraphQLContext`](../../../../../context/type-aliases/GraphQLContext.md)

#### Returns

`Promise`\<`void`\>

***

### emitFundCreated()

> **emitFundCreated**(`data`, `ctx`): `Promise`\<`void`\>

Defined in: [src/graphql/types/Notification/EventBus/eventBus.ts:326](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/types/Notification/EventBus/eventBus.ts#L326)

#### Parameters

##### data

###### creatorName

`string`

###### fundId

`string`

###### fundName

`string`

###### organizationId

`string`

###### organizationName

`string`

##### ctx

[`GraphQLContext`](../../../../../context/type-aliases/GraphQLContext.md)

#### Returns

`Promise`\<`void`\>

***

### emitJoinRequestSubmitted()

> **emitJoinRequestSubmitted**(`data`, `ctx`): `Promise`\<`void`\>

Defined in: [src/graphql/types/Notification/EventBus/eventBus.ts:156](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/types/Notification/EventBus/eventBus.ts#L156)

#### Parameters

##### data

###### organizationId

`string`

###### organizationName

`string`

###### requestId

`string`

###### userId

`string`

###### userName

`string`

##### ctx

[`GraphQLContext`](../../../../../context/type-aliases/GraphQLContext.md)

#### Returns

`Promise`\<`void`\>

***

### emitMembershipRequestAccepted()

> **emitMembershipRequestAccepted**(`data`, `ctx`): `Promise`\<`void`\>

Defined in: [src/graphql/types/Notification/EventBus/eventBus.ts:78](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/types/Notification/EventBus/eventBus.ts#L78)

#### Parameters

##### data

###### organizationId

`string`

###### organizationName

`string`

###### userId

`string`

##### ctx

[`GraphQLContext`](../../../../../context/type-aliases/GraphQLContext.md)

#### Returns

`Promise`\<`void`\>

***

### emitMembershipRequestRejected()

> **emitMembershipRequestRejected**(`data`, `ctx`): `Promise`\<`void`\>

Defined in: [src/graphql/types/Notification/EventBus/eventBus.ts:286](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/types/Notification/EventBus/eventBus.ts#L286)

#### Parameters

##### data

###### organizationId

`string`

###### organizationName

`string`

###### userId

`string`

###### userName

`string`

##### ctx

[`GraphQLContext`](../../../../../context/type-aliases/GraphQLContext.md)

#### Returns

`Promise`\<`void`\>

***

### emitNewMemberJoined()

> **emitNewMemberJoined**(`data`, `ctx`): `Promise`\<`void`\>

Defined in: [src/graphql/types/Notification/EventBus/eventBus.ts:212](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/types/Notification/EventBus/eventBus.ts#L212)

#### Parameters

##### data

###### organizationId

`string`

###### organizationName

`string`

###### userId

`string`

###### userName

`string`

##### ctx

[`GraphQLContext`](../../../../../context/type-aliases/GraphQLContext.md)

#### Returns

`Promise`\<`void`\>

***

### emitPostCreated()

> **emitPostCreated**(`data`, `ctx`): `Promise`\<`void`\>

Defined in: [src/graphql/types/Notification/EventBus/eventBus.ts:40](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/types/Notification/EventBus/eventBus.ts#L40)

#### Parameters

##### data

###### authorName

`string`

###### organizationId

`string`

###### organizationName

`string`

###### postCaption

`string`

###### postId

`string`

##### ctx

[`GraphQLContext`](../../../../../context/type-aliases/GraphQLContext.md)

#### Returns

`Promise`\<`void`\>

***

### emitSendEventInvite()

> **emitSendEventInvite**(`data`, `ctx`): `Promise`\<`void`\>

Defined in: [src/graphql/types/Notification/EventBus/eventBus.ts:459](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/types/Notification/EventBus/eventBus.ts#L459)

#### Parameters

##### data

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

##### ctx

[`GraphQLContext`](../../../../../context/type-aliases/GraphQLContext.md)

#### Returns

`Promise`\<`void`\>

***

### emitUserBlocked()

> **emitUserBlocked**(`data`, `ctx`): `Promise`\<`void`\>

Defined in: [src/graphql/types/Notification/EventBus/eventBus.ts:249](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/types/Notification/EventBus/eventBus.ts#L249)

#### Parameters

##### data

###### organizationId

`string`

###### organizationName

`string`

###### userId

`string`

###### userName

`string`

##### ctx

[`GraphQLContext`](../../../../../context/type-aliases/GraphQLContext.md)

#### Returns

`Promise`\<`void`\>

***

### waitForPending()

> **waitForPending**(): `Promise`\<`void`\>

Defined in: [src/graphql/types/Notification/EventBus/eventBus.ts:22](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/types/Notification/EventBus/eventBus.ts#L22)

Returns a promise that resolves once all currently pending notification
callbacks have settled (resolved or rejected). Useful in tests to avoid
race conditions between fire-and-forget `setImmediate` callbacks and
subsequent database queries.

#### Returns

`Promise`\<`void`\>
