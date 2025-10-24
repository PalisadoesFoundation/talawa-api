[Admin Docs](/)

***

# Class: NotificationEngine

Defined in: [src/graphql/types/Notification/Notification\_engine.ts:45](https://github.com/Sourya07/talawa-api/blob/3df16fa5fb47e8947dc575f048aef648ae9ebcf8/src/graphql/types/Notification/Notification_engine.ts#L45)

NotificationEngine class for managing notifications across the application

## Constructors

### Constructor

> **new NotificationEngine**(`ctx`): `NotificationEngine`

Defined in: [src/graphql/types/Notification/Notification\_engine.ts:53](https://github.com/Sourya07/talawa-api/blob/3df16fa5fb47e8947dc575f048aef648ae9ebcf8/src/graphql/types/Notification/Notification_engine.ts#L53)

Creates a new instance of NotificationEngine

#### Parameters

##### ctx

[`GraphQLContext`](../../../../context/type-aliases/GraphQLContext.md)

GraphQL context containing database connections and user info

#### Returns

`NotificationEngine`

## Methods

### createNotification()

> **createNotification**(`eventType`, `variables`, `audience`, `channelType`): `Promise`\<`string`\>

Defined in: [src/graphql/types/Notification/Notification\_engine.ts:66](https://github.com/Sourya07/talawa-api/blob/3df16fa5fb47e8947dc575f048aef648ae9ebcf8/src/graphql/types/Notification/Notification_engine.ts#L66)

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

The created notification log ID
