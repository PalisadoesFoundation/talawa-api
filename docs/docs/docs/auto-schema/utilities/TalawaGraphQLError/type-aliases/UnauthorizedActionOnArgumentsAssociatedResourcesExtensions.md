[Admin Docs](/)

***

# Type Alias: UnauthorizedActionOnArgumentsAssociatedResourcesExtensions

> **UnauthorizedActionOnArgumentsAssociatedResourcesExtensions**: `object`

Defined in: [src/utilities/TalawaGraphQLError.ts:158](https://github.com/PalisadoesFoundation/talawa-api/blob/1251c45d69620e1317cb8632c6decbdb7edbdb06/src/utilities/TalawaGraphQLError.ts#L158)

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
