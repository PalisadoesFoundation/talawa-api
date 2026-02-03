[API Docs](/)

***

# Type Alias: Paths\<T\>

> **Paths**\<`T`\> = `T` *extends* `object` ? \{ \[K in keyof T\]: \[K, ...Paths\<T\[K\]\>\] \| \[K\] \}\[keyof `T`\] : `never`

Defined in: [src/utilities/getKeyPathsWithNonUndefinedValues.ts:1](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/getKeyPathsWithNonUndefinedValues.ts#L1)

## Type Parameters

### T

`T`
