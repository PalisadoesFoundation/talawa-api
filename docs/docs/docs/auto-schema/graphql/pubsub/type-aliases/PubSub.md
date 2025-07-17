[Admin Docs](/)

***

# Type Alias: PubSub

> **PubSub** = `object`

Defined in: [src/graphql/pubsub.ts:8](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/graphql/pubsub.ts#L8)

Type of the publish and subscribe module used for publishing and subscribing to talawa events.

## Methods

### publish()

> **publish**\<`TKey`\>(`event`, `callback?`): `void`

Defined in: [src/graphql/pubsub.ts:12](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/graphql/pubsub.ts#L12)

This method is used to publish an event.

#### Type Parameters

##### TKey

`TKey` *extends* `` `chats.${string}:chat_messages::create` ``

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

***

### subscribe()

> **subscribe**\<`TKey`\>(`topics`): `Promise`\<`Readable` & `AsyncIterableIterator`\<[`PubSubPublishArgsByKey`](PubSubPublishArgsByKey.md)\[`TKey`\], `any`, `any`\>\>

Defined in: [src/graphql/pubsub.ts:22](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/graphql/pubsub.ts#L22)

This method is used to subscribe to events.

#### Type Parameters

##### TKey

`TKey` *extends* `` `chats.${string}:chat_messages::create` ``

#### Parameters

##### topics

`TKey` | `TKey`[]

#### Returns

`Promise`\<`Readable` & `AsyncIterableIterator`\<[`PubSubPublishArgsByKey`](PubSubPublishArgsByKey.md)\[`TKey`\], `any`, `any`\>\>
