[Admin Docs](/)

***

# Type Alias: UnauthorizedActionExtensions

> **UnauthorizedActionExtensions** = `object`

Defined in: [src/utilities/TalawaGraphQLError.ts:139](https://github.com/gautam-divyanshu/talawa-api/blob/441b833d91882cfef7272c118419933afe47f7b6/src/utilities/TalawaGraphQLError.ts#L139)

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

Defined in: [src/utilities/TalawaGraphQLError.ts:140](https://github.com/gautam-divyanshu/talawa-api/blob/441b833d91882cfef7272c118419933afe47f7b6/src/utilities/TalawaGraphQLError.ts#L140)
