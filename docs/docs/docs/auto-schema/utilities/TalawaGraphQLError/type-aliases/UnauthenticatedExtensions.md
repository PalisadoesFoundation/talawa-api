[Admin Docs](/)

***

# Type Alias: UnauthenticatedExtensions

> **UnauthenticatedExtensions**: `object`

Defined in: [src/utilities/TalawaGraphQLError.ts:93](https://github.com/PalisadoesFoundation/talawa-api/blob/36e30b39ce897bdded5fea4859d9ae00485b5a4c/src/utilities/TalawaGraphQLError.ts#L93)

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
