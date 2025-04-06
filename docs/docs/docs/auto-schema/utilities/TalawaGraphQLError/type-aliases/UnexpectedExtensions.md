[Admin Docs](/)

***

# Type Alias: UnexpectedExtensions

> **UnexpectedExtensions** = `object`

Defined in: [src/utilities/TalawaGraphQLError.ts:198](https://github.com/PurnenduMIshra129th/talawa-api/blob/dd95e2d2302936a5436289a9e626f7f4e2b14e02/src/utilities/TalawaGraphQLError.ts#L198)

When an error that doesn't fit one of the error types listed above occurs. One example would be a database request failure.

## Example

```ts
throw new TalawaGraphQLError({
	extensions: {
		code: "unexpected",
	},
});
```

## Properties

### code

> **code**: `"unexpected"`

Defined in: [src/utilities/TalawaGraphQLError.ts:199](https://github.com/PurnenduMIshra129th/talawa-api/blob/dd95e2d2302936a5436289a9e626f7f4e2b14e02/src/utilities/TalawaGraphQLError.ts#L199)
