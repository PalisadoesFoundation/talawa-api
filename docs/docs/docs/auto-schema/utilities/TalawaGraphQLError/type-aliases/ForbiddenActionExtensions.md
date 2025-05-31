[Admin Docs](/)

***

# Type Alias: ForbiddenActionExtensions

> **ForbiddenActionExtensions** = `object`

Defined in: [src/utilities/TalawaGraphQLError.ts:51](https://github.com/PalisadoesFoundation/talawa-api/blob/b92360e799fdc7cf89a1346eb8395735c501ee9c/src/utilities/TalawaGraphQLError.ts#L51)

When the client tries to perform an action that conflicts with real world expectations of the application.

## Example

```ts
throw new TalawaGraphQLError(
	{
		extensions: {
			code: "forbidden_action",
		},
	},
);
```

## Properties

### code

> **code**: `"forbidden_action"`

Defined in: [src/utilities/TalawaGraphQLError.ts:52](https://github.com/PalisadoesFoundation/talawa-api/blob/b92360e799fdc7cf89a1346eb8395735c501ee9c/src/utilities/TalawaGraphQLError.ts#L52)
