[Admin Docs](/)

***

# Type Alias: UnauthorizedActionExtensions

> **UnauthorizedActionExtensions** = `object`

Defined in: [src/utilities/TalawaGraphQLError.ts:139](https://github.com/Sourya07/talawa-api/blob/3df16fa5fb47e8947dc575f048aef648ae9ebcf8/src/utilities/TalawaGraphQLError.ts#L139)

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

Defined in: [src/utilities/TalawaGraphQLError.ts:140](https://github.com/Sourya07/talawa-api/blob/3df16fa5fb47e8947dc575f048aef648ae9ebcf8/src/utilities/TalawaGraphQLError.ts#L140)
