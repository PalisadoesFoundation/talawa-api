[Admin Docs](/)

***

# Type Alias: UnexpectedExtensions

> **UnexpectedExtensions**: `object`

Defined in: [src/utilities/TalawaGraphQLError.ts:198](https://github.com/PurnenduMIshra129th/talawa-api/blob/8bb4483f6aa0d175e00d3d589e36182f9c58a66a/src/utilities/TalawaGraphQLError.ts#L198)

When an error that doesn't fit one of the error types listed above occurs. One example would be a database request failure.

## Type declaration

### code

> **code**: `"unexpected"`

## Example

```ts
throw new TalawaGraphQLError({
	extensions: {
		code: "unexpected",
	},
});
```
