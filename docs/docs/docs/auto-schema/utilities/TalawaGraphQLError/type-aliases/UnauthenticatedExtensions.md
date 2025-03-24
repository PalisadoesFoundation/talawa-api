[Admin Docs](/)

***

# Type Alias: UnauthenticatedExtensions

> **UnauthenticatedExtensions**: `object`

Defined in: [src/utilities/TalawaGraphQLError.ts:93](https://github.com/NishantSinghhhhh/talawa-api/blob/902a87c428b05018acbd37a72fd0f53e07960330/src/utilities/TalawaGraphQLError.ts#L93)

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
