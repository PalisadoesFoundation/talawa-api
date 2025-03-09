[Admin Docs](/)

***

# Type Alias: UnauthorizedActionExtensions

> **UnauthorizedActionExtensions**: `object`

Defined in: [src/utilities/TalawaGraphQLError.ts:139](https://github.com/syedali237/talawa-api/blob/8c6154f4daaa502448d207545feda14b4d146e99/src/utilities/TalawaGraphQLError.ts#L139)

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
