[Admin Docs](/)

***

# Type Alias: UnexpectedExtensions

> **UnexpectedExtensions**: `object`

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

## Defined in

[src/utilities/TalawaGraphQLError.ts:198](https://github.com/NishantSinghhhhh/talawa-api/blob/05ae6a4794762096d917a90a3af0db22b7c47392/src/utilities/TalawaGraphQLError.ts#L198)
