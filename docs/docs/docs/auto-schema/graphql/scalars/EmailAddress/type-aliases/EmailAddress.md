[Admin Docs](/)

***

# Type Alias: \_EmailAddress

> **\_EmailAddress**: `object`

Defined in: [src/graphql/scalars/EmailAddress.ts:21](https://github.com/PalisadoesFoundation/talawa-api/blob/be5955174726b793a9d0896706e81c3e939858bf/src/graphql/scalars/EmailAddress.ts#L21)

`EmailAddress` scalar type for pothos schema.
The underscore prefix indicates this is an internal type definition.

## Type declaration

### Input

> **Input**: `string`

### Output

> **Output**: `string`

## Example

```ts
Valid: user@example.com
Invalid: user@, user@.com, @example.com
```
