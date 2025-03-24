[Admin Docs](/)

***

# Type Alias: UnexpectedExtensions

> **UnexpectedExtensions**: `object`

Defined in: [src/utilities/TalawaGraphQLError.ts:198](https://github.com/NishantSinghhhhh/talawa-api/blob/502aef4080ad9777c9b76e051d199e7a956ceecc/src/utilities/TalawaGraphQLError.ts#L198)

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
