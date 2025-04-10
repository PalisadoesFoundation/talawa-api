[Admin Docs](/)

***

# Type Alias: UnauthorizedActionExtensions

> **UnauthorizedActionExtensions** = `object`

Defined in: [src/utilities/TalawaGraphQLError.ts:139](https://github.com/PurnenduMIshra129th/talawa-api/blob/86f70716c91247c1756c784fed3bccb85b1ded8e/src/utilities/TalawaGraphQLError.ts#L139)

When the client is not authorized to perform an action.

## Example

```ts
throw new TalawaGraphQLError({
	extensions: {
		code: "unauthorized_action",
	},
});
```

## Properties

### code

> **code**: `"unauthorized_action"`

Defined in: [src/utilities/TalawaGraphQLError.ts:140](https://github.com/PurnenduMIshra129th/talawa-api/blob/86f70716c91247c1756c784fed3bccb85b1ded8e/src/utilities/TalawaGraphQLError.ts#L140)
