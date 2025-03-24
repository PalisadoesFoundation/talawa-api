[Admin Docs](/)

***

# Type Alias: UnauthorizedActionExtensions

> **UnauthorizedActionExtensions**: `object`

Defined in: [src/utilities/TalawaGraphQLError.ts:139](https://github.com/NishantSinghhhhh/talawa-api/blob/902a87c428b05018acbd37a72fd0f53e07960330/src/utilities/TalawaGraphQLError.ts#L139)

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
