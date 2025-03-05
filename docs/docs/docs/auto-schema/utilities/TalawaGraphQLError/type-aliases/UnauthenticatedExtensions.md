[Admin Docs](/)

***

# Type Alias: UnauthenticatedExtensions

> **UnauthenticatedExtensions**: `object`

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

## Defined in

[src/utilities/TalawaGraphQLError.ts:93](https://github.com/NishantSinghhhhh/talawa-api/blob/ff0f1d6ae21d3428519b64e42fe3bfdff573cb6e/src/utilities/TalawaGraphQLError.ts#L93)
