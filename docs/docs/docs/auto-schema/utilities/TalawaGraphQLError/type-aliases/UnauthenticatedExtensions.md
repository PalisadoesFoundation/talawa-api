[Admin Docs](/)

***

# Type Alias: UnauthenticatedExtensions

> **UnauthenticatedExtensions**: `object`

Defined in: src/utilities/TalawaGraphQLError.ts:93

When the client must be authenticated to perform an action.

## Type declaration

### code

> **code**: `"unauthenticated"`

## Example

```ts
throw new TalawaGraphQLError({
	extensions: {
		code: "unauthenticated",
	},
});
```
