[Admin Docs](/)

***

# Type Alias: UnauthorizedActionOnArgumentsAssociatedResourcesExtensions

> **UnauthorizedActionOnArgumentsAssociatedResourcesExtensions** = `object`

Defined in: [src/utilities/TalawaGraphQLError.ts:158](https://github.com/Sourya07/talawa-api/blob/3df16fa5fb47e8947dc575f048aef648ae9ebcf8/src/utilities/TalawaGraphQLError.ts#L158)

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

Defined in: [src/utilities/TalawaGraphQLError.ts:162](https://github.com/Sourya07/talawa-api/blob/3df16fa5fb47e8947dc575f048aef648ae9ebcf8/src/utilities/TalawaGraphQLError.ts#L162)

***

### issues

> **issues**: `object`[]

Defined in: [src/utilities/TalawaGraphQLError.ts:159](https://github.com/Sourya07/talawa-api/blob/3df16fa5fb47e8947dc575f048aef648ae9ebcf8/src/utilities/TalawaGraphQLError.ts#L159)

#### argumentPath

> **argumentPath**: (`string` \| `number`)[]
