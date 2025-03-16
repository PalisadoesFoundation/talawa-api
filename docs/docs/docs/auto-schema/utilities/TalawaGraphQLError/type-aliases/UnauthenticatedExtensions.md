[Admin Docs](/)

***

# Type Alias: UnauthenticatedExtensions

> **UnauthenticatedExtensions**: `object`

Defined in: [src/utilities/TalawaGraphQLError.ts:93](https://github.com/NishantSinghhhhh/talawa-api/blob/69de67039e23da5433da6bf054785223c86c0ed1/src/utilities/TalawaGraphQLError.ts#L93)

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
