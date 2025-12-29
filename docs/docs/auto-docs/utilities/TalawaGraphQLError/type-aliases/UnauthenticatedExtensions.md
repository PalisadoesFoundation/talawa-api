[API Docs](/)

***

# Type Alias: UnauthenticatedExtensions

> **UnauthenticatedExtensions** = `object`

Defined in: [src/utilities/TalawaGraphQLError.ts:111](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/TalawaGraphQLError.ts#L111)

When the client must be authenticated to perform an action.

## Example

```ts
throw new TalawaGraphQLError({
	extensions: {
		code: "unauthenticated",
	},
});
```

## Properties

### code

> **code**: `"unauthenticated"`

Defined in: [src/utilities/TalawaGraphQLError.ts:112](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/TalawaGraphQLError.ts#L112)
