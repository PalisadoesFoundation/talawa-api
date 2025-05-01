[Admin Docs](/)

***

# Type Alias: ForbiddenActionOnArgumentsAssociatedResourcesExtensions

> **ForbiddenActionOnArgumentsAssociatedResourcesExtensions** = `object`

Defined in: [src/utilities/TalawaGraphQLError.ts:75](https://github.com/PalisadoesFoundation/talawa-api/blob/ba7157ff8b26bc2c54d7ad9ad4d0db0ff21eda4d/src/utilities/TalawaGraphQLError.ts#L75)

When the client tries to perform actions on resources associated to arguments that conflict with real world expectations of the application. One example would be a user trying to follow their own account on a social media application.

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

## Properties

### code

> **code**: `"forbidden_action_on_arguments_associated_resources"`

Defined in: [src/utilities/TalawaGraphQLError.ts:76](https://github.com/PalisadoesFoundation/talawa-api/blob/ba7157ff8b26bc2c54d7ad9ad4d0db0ff21eda4d/src/utilities/TalawaGraphQLError.ts#L76)

***

### issues

> **issues**: `object`[]

Defined in: [src/utilities/TalawaGraphQLError.ts:77](https://github.com/PalisadoesFoundation/talawa-api/blob/ba7157ff8b26bc2c54d7ad9ad4d0db0ff21eda4d/src/utilities/TalawaGraphQLError.ts#L77)

#### argumentPath

> **argumentPath**: (`string` \| `number`)[]

#### message

> **message**: `string`
