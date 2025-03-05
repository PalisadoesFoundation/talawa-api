[Admin Docs](/)

***

# Type Alias: UnauthorizedActionExtensions

> **UnauthorizedActionExtensions**: `object`

When the client is not authorized to perform an action.

## Type declaration

### code

> **code**: `"unauthorized_action"`

## Example

```ts
throw new TalawaGraphQLError({
	extensions: {
		code: "unauthorized_action",
	},
});
```

## Defined in

[src/utilities/TalawaGraphQLError.ts:139](https://github.com/NishantSinghhhhh/talawa-api/blob/ff0f1d6ae21d3428519b64e42fe3bfdff573cb6e/src/utilities/TalawaGraphQLError.ts#L139)
