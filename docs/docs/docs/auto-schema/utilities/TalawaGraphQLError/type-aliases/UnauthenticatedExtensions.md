[Admin Docs](/)

***

# Type Alias: UnauthenticatedExtensions

> **UnauthenticatedExtensions** = `object`

Defined in: [src/utilities/TalawaGraphQLError.ts:93](https://github.com/PalisadoesFoundation/talawa-api/blob/b92360e799fdc7cf89a1346eb8395735c501ee9c/src/utilities/TalawaGraphQLError.ts#L93)

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

Defined in: [src/utilities/TalawaGraphQLError.ts:94](https://github.com/PalisadoesFoundation/talawa-api/blob/b92360e799fdc7cf89a1346eb8395735c501ee9c/src/utilities/TalawaGraphQLError.ts#L94)
