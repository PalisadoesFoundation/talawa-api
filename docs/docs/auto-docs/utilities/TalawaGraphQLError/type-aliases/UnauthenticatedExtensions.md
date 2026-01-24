[API Docs](/)

***

# Type Alias: UnauthenticatedExtensions

> **UnauthenticatedExtensions** = `object`

Defined in: src/utilities/TalawaGraphQLError.ts:112

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

Defined in: src/utilities/TalawaGraphQLError.ts:113
