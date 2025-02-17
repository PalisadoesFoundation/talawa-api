[Admin Docs](/)

***

# Type Alias: UnauthorizedArgumentsExtensions

> **UnauthorizedArgumentsExtensions**: `object`

Defined in: [src/utilities/TalawaGraphQLError.ts:181](https://github.com/Suyash878/talawa-api/blob/05d9dfc8d9c5928ef559c72f2ab0492d0dbbb48c/src/utilities/TalawaGraphQLError.ts#L181)

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
