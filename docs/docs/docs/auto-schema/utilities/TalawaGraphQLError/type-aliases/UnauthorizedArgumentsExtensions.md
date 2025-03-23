[Admin Docs](/)

***

# Type Alias: UnauthorizedArgumentsExtensions

> **UnauthorizedArgumentsExtensions**: `object`

Defined in: [src/utilities/TalawaGraphQLError.ts:181](https://github.com/NishantSinghhhhh/talawa-api/blob/b87b8a22e4088f1ea75d4769c10896977d674855/src/utilities/TalawaGraphQLError.ts#L181)

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
