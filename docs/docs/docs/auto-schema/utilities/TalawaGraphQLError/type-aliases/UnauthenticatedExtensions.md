[Admin Docs](/)

***

# Type Alias: UnauthenticatedExtensions

> **UnauthenticatedExtensions**: `object`

Defined in: [src/utilities/TalawaGraphQLError.ts:93](https://github.com/syedali237/talawa-api/blob/2d0d513d5268a339b8dac6b4711f8e71e79fc0e4/src/utilities/TalawaGraphQLError.ts#L93)

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
