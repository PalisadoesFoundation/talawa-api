[Admin Docs](/)

***

# Type Alias: UnauthenticatedExtensions

> **UnauthenticatedExtensions**: `object`

Defined in: [src/utilities/TalawaGraphQLError.ts:93](https://github.com/syedali237/talawa-api/blob/8c6154f4daaa502448d207545feda14b4d146e99/src/utilities/TalawaGraphQLError.ts#L93)

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
