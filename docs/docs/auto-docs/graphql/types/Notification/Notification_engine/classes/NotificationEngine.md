[**talawa-api**](../../../../../README.md)

***

# Class: NotificationEngine

Defined in: [src/graphql/types/Notification/Notification\_engine.ts:45](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/graphql/types/Notification/Notification_engine.ts#L45)

NotificationEngine class for managing notifications across the application

## Constructors

### Constructor

> **new NotificationEngine**(`ctx`): `NotificationEngine`

Defined in: [src/graphql/types/Notification/Notification\_engine.ts:53](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/graphql/types/Notification/Notification_engine.ts#L53)

Creates a new instance of NotificationEngine

#### Parameters

##### ctx

[`GraphQLContext`](../../../../context/type-aliases/GraphQLContext.md)

GraphQL context containing database connections and user info

#### Returns

`NotificationEngine`

## Methods

### createDirectEmailNotification()

> **createDirectEmailNotification**(`eventType`, `variables`, `receiverMail`, `channelType`): `Promise`\<`string`\>

Defined in: [src/graphql/types/Notification/Notification\_engine.ts:384](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/graphql/types/Notification/Notification_engine.ts#L384)

Creates a direct email notification for external recipients (non-users).
Uses the template system with provided variables for rendering.

#### Parameters

##### eventType

`string`

Type of event (e.g., "send_event_invite")

##### variables

[`NotificationVariables`](../interfaces/NotificationVariables.md)

Variables to render in the template

##### receiverMail

Email address of the recipient(s)

`string` | `string`[]

##### channelType

[`NotificationChannelType`](../enumerations/NotificationChannelType.md) = `NotificationChannelType.EMAIL`

Channel type (defaults to EMAIL)

#### Returns

`Promise`\<`string`\>

- The created email notification ID

***

### createNotification()

> **createNotification**(`eventType`, `variables`, `audience`, `channelType`): `Promise`\<`string`\>

Defined in: [src/graphql/types/Notification/Notification\_engine.ts:66](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/graphql/types/Notification/Notification_engine.ts#L66)

Creates a notification using a template and sends it to specified audience

#### Parameters

##### eventType

`string`

Type of event that triggered the notification

##### variables

[`NotificationVariables`](../interfaces/NotificationVariables.md)

Object containing variables to be replaced in template

##### audience

Target audience for the notification

[`NotificationAudience`](../interfaces/NotificationAudience.md) | [`NotificationAudience`](../interfaces/NotificationAudience.md)[]

##### channelType

[`NotificationChannelType`](../enumerations/NotificationChannelType.md) = `NotificationChannelType.IN_APP`

Channel to deliver notification (in_app, email)

#### Returns

`Promise`\<`string`\>

- The created notification log ID
