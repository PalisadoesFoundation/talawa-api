[Admin Docs](/)

***

# Type Alias: UnexpectedExtensions

> **UnexpectedExtensions**: `object`

Defined in: [src/utilities/TalawaGraphQLError.ts:198](https://github.com/PratapRathi/talawa-api/blob/d256975b8804135eeae09572d0d303ebdab3b3d4/src/utilities/TalawaGraphQLError.ts#L198)

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
