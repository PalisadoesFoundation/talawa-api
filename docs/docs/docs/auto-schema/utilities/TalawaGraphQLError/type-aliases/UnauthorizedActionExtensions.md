[Admin Docs](/)

***

# Type Alias: UnauthorizedActionExtensions

> **UnauthorizedActionExtensions**: `object`

Defined in: [src/utilities/TalawaGraphQLError.ts:139](https://github.com/NishantSinghhhhh/talawa-api/blob/f689e29732f10b6ae99c0bb4da8790277c8377f0/src/utilities/TalawaGraphQLError.ts#L139)

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
