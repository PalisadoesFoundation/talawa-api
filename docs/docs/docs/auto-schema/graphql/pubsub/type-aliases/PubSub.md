[Admin Docs](/)

***

# Type Alias: PubSub

> **PubSub**: `object`

<<<<<<< HEAD
=======
Defined in: [src/graphql/pubsub.ts:8](https://github.com/PalisadoesFoundation/talawa-api/blob/37e2d6abe1cabaa02f97a3c6c418b81e8fcb5a13/src/graphql/pubsub.ts#L8)

>>>>>>> develop-postgres
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

[src/graphql/pubsub.ts:8](https://github.com/NishantSinghhhhh/talawa-api/blob/ff0f1d6ae21d3428519b64e42fe3bfdff573cb6e/src/graphql/pubsub.ts#L8)
