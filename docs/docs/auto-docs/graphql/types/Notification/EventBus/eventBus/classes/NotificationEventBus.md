[API Docs](/)

***

# Class: NotificationEventBus

Defined in: src/graphql/types/Notification/EventBus/eventBus.ts:9

## Extends

- `EventEmitter`

## Constructors

### Constructor

> **new NotificationEventBus**(`options?`): `NotificationEventBus`

Defined in: node\_modules/.pnpm/@types+node@22.19.3/node\_modules/@types/node/events.d.ts:101

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

Defined in: src/graphql/types/Notification/EventBus/eventBus.ts:85

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

Defined in: src/graphql/types/Notification/EventBus/eventBus.ts:335

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

Defined in: src/graphql/types/Notification/EventBus/eventBus.ts:383

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

Defined in: src/graphql/types/Notification/EventBus/eventBus.ts:296

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

Defined in: src/graphql/types/Notification/EventBus/eventBus.ts:126

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

Defined in: src/graphql/types/Notification/EventBus/eventBus.ts:48

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

Defined in: src/graphql/types/Notification/EventBus/eventBus.ts:256

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

Defined in: src/graphql/types/Notification/EventBus/eventBus.ts:182

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

Defined in: src/graphql/types/Notification/EventBus/eventBus.ts:10

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

Defined in: src/graphql/types/Notification/EventBus/eventBus.ts:429

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

Defined in: src/graphql/types/Notification/EventBus/eventBus.ts:219

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
