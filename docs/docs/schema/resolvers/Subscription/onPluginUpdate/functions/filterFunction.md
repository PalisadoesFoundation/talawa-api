[Admin Docs](/)

***

# Function: filterFunction()

> **filterFunction**(`payload`, `context`): `Promise`\<`boolean`\>

This property included a `subscribe` method, which is used to
subscribe the `current_user` to get updates for Group chats.

## Parameters

### payload

`any`

### context

`any`

## Returns

`Promise`\<`boolean`\>

## Remarks

To control updates on a per-client basis, the function uses the `withFilter`
method imported from `apollo-server-express` module.
You can learn about `subscription` [here](https://www.apollographql.com/docs/apollo-server/data/subscriptions/).

## Defined in

[src/resolvers/Subscription/onPluginUpdate.ts:20](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/resolvers/Subscription/onPluginUpdate.ts#L20)
