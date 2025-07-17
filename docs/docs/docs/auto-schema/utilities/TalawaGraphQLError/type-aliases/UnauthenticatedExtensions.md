[Admin Docs](/)

***

# Type Alias: UnauthenticatedExtensions

> **UnauthenticatedExtensions** = `object`

Defined in: [src/utilities/TalawaGraphQLError.ts:93](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/utilities/TalawaGraphQLError.ts#L93)

When the client must be authenticated to perform an action.

## Example

```ts
throw new TalawaGraphQLError({
	extensions: {
		code: "unauthenticated",
	},
});
```

## Properties

### code

> **code**: `"unauthenticated"`

Defined in: [src/utilities/TalawaGraphQLError.ts:94](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/utilities/TalawaGraphQLError.ts#L94)
