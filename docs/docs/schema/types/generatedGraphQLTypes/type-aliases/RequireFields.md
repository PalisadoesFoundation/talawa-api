[**talawa-api**](../../../README.md)

***

# Type Alias: RequireFields\<T, K\>

> **RequireFields**\<`T`, `K`\>: [`Omit`](Omit.md)\<`T`, `K`\> & `{ [P in K]-?: NonNullable<T[P]> }`

## Type Parameters

• **T**

• **K** *extends* keyof `T`

## Defined in

[src/types/generatedGraphQLTypes.ts:46](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/types/generatedGraphQLTypes.ts#L46)
