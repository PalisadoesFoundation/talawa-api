[Admin Docs](/)

***

# Type Alias: UnauthorizedActionOnArgumentsAssociatedResourcesExtensions

> **UnauthorizedActionOnArgumentsAssociatedResourcesExtensions** = `object`

Defined in: src/utilities/TalawaGraphQLError.ts:158

When the client is not authorized to perform an action on a resource associated to an argument.

## Example

```ts
throw new TalawaGraphQLError({
	extensions: {
		code: "unauthorized_action_on_arguments_associated_resources",
		issues: [
			{
				argumentPath: ["input", "id"],
			},
		],
	},
});
```

## Properties

### code

> **code**: `"unauthorized_action_on_arguments_associated_resources"`

Defined in: src/utilities/TalawaGraphQLError.ts:162

***

### issues

> **issues**: `object`[]

Defined in: src/utilities/TalawaGraphQLError.ts:159

#### argumentPath

> **argumentPath**: (`string` \| `number`)[]
