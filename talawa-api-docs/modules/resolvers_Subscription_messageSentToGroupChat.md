[talawa-api](../README.md) / [Exports](../modules.md) / resolvers/Subscription/messageSentToGroupChat

# Module: resolvers/Subscription/messageSentToGroupChat

## Table of contents

### Variables

- [messageSentToGroupChat](resolvers_Subscription_messageSentToGroupChat.md#messagesenttogroupchat)

### Functions

- [filterFunction](resolvers_Subscription_messageSentToGroupChat.md#filterfunction)

## Variables

### messageSentToGroupChat

• `Const` **messageSentToGroupChat**: [`SubscriptionResolvers`](types_generatedGraphQLTypes.md#subscriptionresolvers)[``"messageSentToGroupChat"``]

This property included a `subscribe` method, which is used to
subscribe the `current_user` to get updates for Group chats.

**`Remarks`**

To control updates on a per-client basis, the function uses the `withFilter`
method imported from `apollo-server-express` module.
You can learn about `subscription` [here](https://www.apollographql.com/docs/apollo-server/data/subscriptions/).

#### Defined in

[src/resolvers/Subscription/messageSentToGroupChat.ts:35](https://github.com/PalisadoesFoundation/talawa-api/blob/6295a23/src/resolvers/Subscription/messageSentToGroupChat.ts#L35)

## Functions

### filterFunction

▸ **filterFunction**(`payload`, `context`): `Promise`\<`boolean`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `payload` | `any` |
| `context` | `any` |

#### Returns

`Promise`\<`boolean`\>

#### Defined in

[src/resolvers/Subscription/messageSentToGroupChat.ts:7](https://github.com/PalisadoesFoundation/talawa-api/blob/6295a23/src/resolvers/Subscription/messageSentToGroupChat.ts#L7)
