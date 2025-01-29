[Admin Docs](/)

***

# Type Alias: RequireFields\<T, K\>

> **RequireFields**\<`T`, `K`\>: [`Omit`](Omit.md)\<`T`, `K`\> & `{ [P in K]-?: NonNullable<T[P]> }`

## Type Parameters

• **T**

• **K** *extends* keyof `T`

## Defined in

[src/types/generatedGraphQLTypes.ts:46](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/types/generatedGraphQLTypes.ts#L46)
