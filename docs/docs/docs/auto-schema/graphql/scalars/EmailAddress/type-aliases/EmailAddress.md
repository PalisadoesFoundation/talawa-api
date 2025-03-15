[Admin Docs](/)

***

# Type Alias: \_EmailAddress

> **\_EmailAddress**: `object`

Defined in: [src/graphql/scalars/EmailAddress.ts:21](https://github.com/syedali237/talawa-api/blob/2d0d513d5268a339b8dac6b4711f8e71e79fc0e4/src/graphql/scalars/EmailAddress.ts#L21)

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
