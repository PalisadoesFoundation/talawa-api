[Admin Docs](/)

***

# Type Alias: UnauthorizedActionExtensions

> **UnauthorizedActionExtensions** = `object`

Defined in: [src/utilities/TalawaGraphQLError.ts:139](https://github.com/gautam-divyanshu/talawa-api/blob/de42235531e11387f0ad0479547630845dbc8b37/src/utilities/TalawaGraphQLError.ts#L139)

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

Defined in: [src/utilities/TalawaGraphQLError.ts:140](https://github.com/gautam-divyanshu/talawa-api/blob/de42235531e11387f0ad0479547630845dbc8b37/src/utilities/TalawaGraphQLError.ts#L140)
