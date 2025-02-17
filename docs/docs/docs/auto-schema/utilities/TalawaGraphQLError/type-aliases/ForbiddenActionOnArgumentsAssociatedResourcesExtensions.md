[Admin Docs](/)

***

# Type Alias: ForbiddenActionOnArgumentsAssociatedResourcesExtensions

> **ForbiddenActionOnArgumentsAssociatedResourcesExtensions**: `object`

Defined in: [src/utilities/TalawaGraphQLError.ts:75](https://github.com/Suyash878/talawa-api/blob/3646aad880eea5a7cfb665aa9031a4d873c30798/src/utilities/TalawaGraphQLError.ts#L75)

When the client tries to perform actions on resources associated to arguments that conflict with real world expectations of the application. One example would be a user trying to follow their own account on a social media application.

## Type declaration

### code

> **code**: `"forbidden_action_on_arguments_associated_resources"`

### issues

> **issues**: `object`[]

## Example

```ts
throw new TalawaGraphQLError({
	extensions: {
		code: "forbidden_action_on_arguments_associated_resources",
		issues: [
			{
				argumentPath: ["input", 0, "emailAddress"],
				message: "This email address is not available.",
			},
			{
				argumentPath: ["input", 3, "username"],
				message: "This username is not available.",
			},
		],
	},
});
```
