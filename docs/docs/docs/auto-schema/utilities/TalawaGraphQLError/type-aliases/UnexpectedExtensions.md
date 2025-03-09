[Admin Docs](/)

***

# Type Alias: UnexpectedExtensions

> **UnexpectedExtensions**: `object`

Defined in: [src/utilities/TalawaGraphQLError.ts:198](https://github.com/syedali237/talawa-api/blob/691786dc98e76819737c41ef0af34983792105fd/src/utilities/TalawaGraphQLError.ts#L198)

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
