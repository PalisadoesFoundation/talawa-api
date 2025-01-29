[**talawa-api**](../../../../README.md)

***

# Variable: onPluginUpdate

> `const` **onPluginUpdate**: [`SubscriptionResolvers`](../../../../types/generatedGraphQLTypes/type-aliases/SubscriptionResolvers.md)\[`"onPluginUpdate"`\]

This property included a `subscribe` method, which is used to
subscribe the `current_user` to get updates for Group chats.

## Remarks

To control updates on a per-client basis, the function uses the `withFilter`
method imported from `apollo-server-express` module.
You can learn about `subscription` [here](https://www.apollographql.com/docs/apollo-server/data/subscriptions/).

## Defined in

[src/resolvers/Subscription/onPluginUpdate.ts:47](https://github.com/Suyash878/talawa-api/blob/f376d03c37e9acd046e7cc983947432c95f74442/src/resolvers/Subscription/onPluginUpdate.ts#L47)
