[Admin Docs](/)

***

# Type Alias: UnauthorizedActionExtensions

> **UnauthorizedActionExtensions**: `object`

Defined in: src/utilities/TalawaGraphQLError.ts:139

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
