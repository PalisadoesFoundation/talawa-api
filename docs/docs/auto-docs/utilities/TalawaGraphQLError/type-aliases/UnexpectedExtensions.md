[API Docs](/)

***

# Type Alias: UnexpectedExtensions

> **UnexpectedExtensions** = `object`

Defined in: [src/utilities/TalawaGraphQLError.ts:223](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/TalawaGraphQLError.ts#L223)

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

Defined in: [src/utilities/TalawaGraphQLError.ts:224](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/TalawaGraphQLError.ts#L224)
