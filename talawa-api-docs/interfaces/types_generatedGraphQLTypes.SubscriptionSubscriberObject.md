[talawa-api](../README.md) / [Exports](../modules.md) / [types/generatedGraphQLTypes](../modules/types_generatedGraphQLTypes.md) / SubscriptionSubscriberObject

# Interface: SubscriptionSubscriberObject\<TResult, TKey, TParent, TContext, TArgs\>

[types/generatedGraphQLTypes](../modules/types_generatedGraphQLTypes.md).SubscriptionSubscriberObject

## Type parameters

| Name | Type |
| :------ | :------ |
| `TResult` | `TResult` |
| `TKey` | extends `string` |
| `TParent` | `TParent` |
| `TContext` | `TContext` |
| `TArgs` | `TArgs` |

## Table of contents

### Properties

- [resolve](types_generatedGraphQLTypes.SubscriptionSubscriberObject.md#resolve)
- [subscribe](types_generatedGraphQLTypes.SubscriptionSubscriberObject.md#subscribe)

## Properties

### resolve

• `Optional` **resolve**: [`SubscriptionResolveFn`](../modules/types_generatedGraphQLTypes.md#subscriptionresolvefn)\<`TResult`, \{ [key in string]: TResult }, `TContext`, `TArgs`\>

#### Defined in

[src/types/generatedGraphQLTypes.ts:1866](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/types/generatedGraphQLTypes.ts#L1866)

___

### subscribe

• **subscribe**: [`SubscriptionSubscribeFn`](../modules/types_generatedGraphQLTypes.md#subscriptionsubscribefn)\<\{ [key in string]: TResult }, `TParent`, `TContext`, `TArgs`\>

#### Defined in

[src/types/generatedGraphQLTypes.ts:1865](https://github.com/PalisadoesFoundation/talawa-api/blob/ae7aa4f/src/types/generatedGraphQLTypes.ts#L1865)
