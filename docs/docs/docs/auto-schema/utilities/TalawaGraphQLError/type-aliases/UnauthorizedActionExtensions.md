[Admin Docs](/)

***

# Type Alias: UnauthorizedActionExtensions

> **UnauthorizedActionExtensions**: `object`

Defined in: [src/utilities/TalawaGraphQLError.ts:139](https://github.com/Suyash878/talawa-api/blob/dcefc5853f313fc5e9e097849457ef0d144bcf61/src/utilities/TalawaGraphQLError.ts#L139)

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
