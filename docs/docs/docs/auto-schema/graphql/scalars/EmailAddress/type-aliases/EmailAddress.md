[Admin Docs](/)

***

# Type Alias: \_EmailAddress

> **\_EmailAddress**: `object`

Defined in: [src/graphql/scalars/EmailAddress.ts:21](https://github.com/Suyash878/talawa-api/blob/0d5834ec7c0ad3d008c3a8e58fbf32c7824b9122/src/graphql/scalars/EmailAddress.ts#L21)

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
