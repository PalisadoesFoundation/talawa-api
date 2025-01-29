[Admin Docs](/)

***

# Type Alias: Incremental\<T\>

> **Incremental**\<`T`\>: `T` \| \{ \[P in keyof T\]?: P extends " $fragmentName" \| "\_\_typename" ? T\[P\] : never \}

## Type Parameters

• **T**

## Defined in

[src/types/generatedGraphQLTypes.ts:44](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/types/generatedGraphQLTypes.ts#L44)
