[Admin Docs](/)

***

# Type Alias: UnauthorizedActionOnArgumentsAssociatedResourcesExtensions

> **UnauthorizedActionOnArgumentsAssociatedResourcesExtensions**: `object`

Defined in: [src/utilities/TalawaGraphQLError.ts:158](https://github.com/NishantSinghhhhh/talawa-api/blob/92ff044a4e2bbc8719de2b33b4f8d7d0a9aa0174/src/utilities/TalawaGraphQLError.ts#L158)

When the client is not authorized to perform an action on a resource associated to an argument.

## Type declaration

### code

> **code**: `"unauthorized_action_on_arguments_associated_resources"`

### issues

> **issues**: `object`[]

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
