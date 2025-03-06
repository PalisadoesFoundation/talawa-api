[Admin Docs](/)

***

# Type Alias: PubSub

> **PubSub**: `object`

Defined in: [src/graphql/pubsub.ts:8](https://github.com/PurnenduMIshra129th/talawa-api/blob/4369c9351f5b76f958b297b25ab2b17196210af9/src/graphql/pubsub.ts#L8)

Type of the publish and subscribe module used for publishing and subscribing to talawa events.

## Type declaration

### publish()

This method is used to publish an event.

#### Type Parameters

• **TKey** *extends* `` `chats.${string}:chat_messages::create` ``

#### Parameters

##### event

###### payload

[`PubSubPublishArgsByKey`](PubSubPublishArgsByKey.md)\[`TKey`\]

###### topic

`TKey`

##### callback?

() => `void`

#### Returns

`void`

### subscribe()

This method is used to subscribe to events.

#### Type Parameters

• **TKey** *extends* `` `chats.${string}:chat_messages::create` ``

#### Parameters

##### topics

`TKey` | `TKey`[]

#### Returns

`Promise`\<`Readable` & `AsyncIterableIterator`\<[`PubSubPublishArgsByKey`](PubSubPublishArgsByKey.md)\[`TKey`\], `any`, `any`\>\>
