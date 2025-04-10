[Admin Docs](/)

***

# Type Alias: UnauthorizedActionExtensions

> **UnauthorizedActionExtensions** = `object`

Defined in: [src/utilities/TalawaGraphQLError.ts:139](https://github.com/PurnenduMIshra129th/talawa-api/blob/89904a627ec60a3b378f6b033f4255df4e9e59ab/src/utilities/TalawaGraphQLError.ts#L139)

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

Defined in: [src/utilities/TalawaGraphQLError.ts:140](https://github.com/PurnenduMIshra129th/talawa-api/blob/89904a627ec60a3b378f6b033f4255df4e9e59ab/src/utilities/TalawaGraphQLError.ts#L140)
