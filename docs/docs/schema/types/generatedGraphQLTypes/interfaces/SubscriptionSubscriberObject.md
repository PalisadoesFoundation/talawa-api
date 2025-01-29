[**talawa-api**](../../../README.md)

***

# Interface: SubscriptionSubscriberObject\<TResult, TKey, TParent, TContext, TArgs\>

## Type Parameters

• **TResult**

• **TKey** *extends* `string`

• **TParent**

• **TContext**

• **TArgs**

## Properties

### resolve?

> `optional` **resolve**: [`SubscriptionResolveFn`](../type-aliases/SubscriptionResolveFn.md)\<`TResult`, `{ [key in string]: TResult }`, `TContext`, `TArgs`\>

#### Defined in

[src/types/generatedGraphQLTypes.ts:3453](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/types/generatedGraphQLTypes.ts#L3453)

***

### subscribe

> **subscribe**: [`SubscriptionSubscribeFn`](../type-aliases/SubscriptionSubscribeFn.md)\<`{ [key in string]: TResult }`, `TParent`, `TContext`, `TArgs`\>

#### Defined in

[src/types/generatedGraphQLTypes.ts:3452](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/types/generatedGraphQLTypes.ts#L3452)
