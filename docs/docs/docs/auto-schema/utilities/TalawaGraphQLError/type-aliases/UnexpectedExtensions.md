[Admin Docs](/)

***

# Type Alias: UnexpectedExtensions

> **UnexpectedExtensions** = `object`

Defined in: [src/utilities/TalawaGraphQLError.ts:198](https://github.com/gautam-divyanshu/talawa-api/blob/441b833d91882cfef7272c118419933afe47f7b6/src/utilities/TalawaGraphQLError.ts#L198)

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

Defined in: [src/utilities/TalawaGraphQLError.ts:199](https://github.com/gautam-divyanshu/talawa-api/blob/441b833d91882cfef7272c118419933afe47f7b6/src/utilities/TalawaGraphQLError.ts#L199)
