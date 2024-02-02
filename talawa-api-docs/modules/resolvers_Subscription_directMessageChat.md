[talawa-api](../README.md) / [Exports](../modules.md) / resolvers/Subscription/directMessageChat

# Module: resolvers/Subscription/directMessageChat

## Table of contents

### Variables

- [directMessageChat](resolvers_Subscription_directMessageChat.md#directmessagechat)

## Variables

### directMessageChat

• `Const` **directMessageChat**: [`SubscriptionResolvers`](types_generatedGraphQLTypes.md#subscriptionresolvers)[``"directMessageChat"``]

This property contained a `subscribe` field, which is used to subscribe
the user to get updates for the `CHAT_CHANNEL` event.

**`Remarks`**

To control updates on a per-client basis, the function uses the `withFilter`
method imported from `apollo-server-express` module.
You can learn about `subscription` [here](https://www.apollographql.com/docs/apollo-server/data/subscriptions/).

#### Defined in

[src/resolvers/Subscription/directMessageChat.ts:12](https://github.com/PalisadoesFoundation/talawa-api/blob/515781e/src/resolvers/Subscription/directMessageChat.ts#L12)
