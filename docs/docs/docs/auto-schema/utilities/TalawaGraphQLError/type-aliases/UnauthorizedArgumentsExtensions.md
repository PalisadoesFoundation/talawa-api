[Admin Docs](/)

***

# Type Alias: UnauthorizedArgumentsExtensions

> **UnauthorizedArgumentsExtensions**: `object`

Defined in: [src/utilities/TalawaGraphQLError.ts:181](https://github.com/PalisadoesFoundation/talawa-api/blob/1251c45d69620e1317cb8632c6decbdb7edbdb06/src/utilities/TalawaGraphQLError.ts#L181)

When the client is not authorized to perform an action with certain arguments.

## Type declaration

### code

> **code**: `"unauthorized_arguments"`

### issues

> **issues**: `object`[]

## Example

```ts
throw new TalawaGraphQLError({
	extensions: {
		code: "unauthorized_arguments",
		issues: [
			{
				argumentPath: ["input", "role"],
				message: "You are not authorzied to change your user role.",
			},
		],
	},
});
```
