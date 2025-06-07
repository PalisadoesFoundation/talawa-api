[Admin Docs](/)

***

# Type Alias: UnauthorizedArgumentsExtensions

> **UnauthorizedArgumentsExtensions** = `object`

Defined in: src/utilities/TalawaGraphQLError.ts:181

When the client is not authorized to perform an action with certain arguments.

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

## Properties

### code

> **code**: `"unauthorized_arguments"`

Defined in: src/utilities/TalawaGraphQLError.ts:185

***

### issues

> **issues**: `object`[]

Defined in: src/utilities/TalawaGraphQLError.ts:182

#### argumentPath

> **argumentPath**: (`string` \| `number`)[]
