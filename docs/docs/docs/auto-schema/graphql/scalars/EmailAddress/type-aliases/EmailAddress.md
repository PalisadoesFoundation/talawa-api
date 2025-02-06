[Admin Docs](/)

***

# Type Alias: \_EmailAddress

> **\_EmailAddress**: `object`

Defined in: [src/graphql/scalars/EmailAddress.ts:21](https://github.com/Suyash878/talawa-api/blob/4657139c817cb5935454def8fb620b05175365a9/src/graphql/scalars/EmailAddress.ts#L21)

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
