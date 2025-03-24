[Admin Docs](/)

***

# Type Alias: UnexpectedExtensions

> **UnexpectedExtensions**: `object`

Defined in: [src/utilities/TalawaGraphQLError.ts:198](https://github.com/NishantSinghhhhh/talawa-api/blob/902a87c428b05018acbd37a72fd0f53e07960330/src/utilities/TalawaGraphQLError.ts#L198)

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
