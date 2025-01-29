[Admin Docs](/)

***

# Type Alias: MakeMaybe\<T, K\>

> **MakeMaybe**\<`T`, `K`\>: [`Omit`](Omit.md)\<`T`, `K`\> & `{ [SubKey in K]: Maybe<T[SubKey]> }`

## Type Parameters

• **T**

• **K** *extends* keyof `T`

## Defined in

[src/types/generatedGraphQLTypes.ts:42](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/types/generatedGraphQLTypes.ts#L42)
