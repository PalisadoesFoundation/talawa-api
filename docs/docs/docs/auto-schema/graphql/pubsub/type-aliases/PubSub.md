[Admin Docs](/)

***

# Type Alias: PubSub

> **PubSub**: `object`

Type of the publish and subscribe module used for publishing and subscribing to talawa events.

## Type declaration

### publish()

This method is used to publish an event.

#### Type Parameters

• **TKey** *extends* \`chats.$\{string\}:chat\_messages::create\`

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

• **TKey** *extends* \`chats.$\{string\}:chat\_messages::create\`

#### Parameters

##### topics

`TKey` | `TKey`[]

#### Returns

`Promise`\<`Readable` & `AsyncIterableIterator`\<[`PubSubPublishArgsByKey`](PubSubPublishArgsByKey.md)\[`TKey`\]\>\>

## Defined in

[src/graphql/pubsub.ts:8](https://github.com/NishantSinghhhhh/talawa-api/blob/05ae6a4794762096d917a90a3af0db22b7c47392/src/graphql/pubsub.ts#L8)
