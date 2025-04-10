[Admin Docs](/)

***

# Type Alias: UnauthorizedActionOnArgumentsAssociatedResourcesExtensions

> **UnauthorizedActionOnArgumentsAssociatedResourcesExtensions** = `object`

Defined in: [src/utilities/TalawaGraphQLError.ts:158](https://github.com/PurnenduMIshra129th/talawa-api/blob/6dd1cb0af1891b88aa61534ec8a6180536cd264f/src/utilities/TalawaGraphQLError.ts#L158)

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

Defined in: [src/utilities/TalawaGraphQLError.ts:162](https://github.com/PurnenduMIshra129th/talawa-api/blob/6dd1cb0af1891b88aa61534ec8a6180536cd264f/src/utilities/TalawaGraphQLError.ts#L162)

***

### issues

> **issues**: `object`[]

Defined in: [src/utilities/TalawaGraphQLError.ts:159](https://github.com/PurnenduMIshra129th/talawa-api/blob/6dd1cb0af1891b88aa61534ec8a6180536cd264f/src/utilities/TalawaGraphQLError.ts#L159)

#### argumentPath

> **argumentPath**: (`string` \| `number`)[]
