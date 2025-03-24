[Admin Docs](/)

***

# Type Alias: InvalidArgumentsExtensions

> **InvalidArgumentsExtensions**: `object`

Defined in: [src/utilities/TalawaGraphQLError.ts:121](https://github.com/NishantSinghhhhh/talawa-api/blob/902a87c428b05018acbd37a72fd0f53e07960330/src/utilities/TalawaGraphQLError.ts#L121)

When the client provides invalid arguments in a graphql operation.

## Type declaration

### code

> **code**: `"invalid_arguments"`

### issues

> **issues**: `object`[]

## Example

```ts
throw new TalawaGraphQLError({
	extensions: {
		code: "invalid_arguments",
		issues: [
			{
				argumentPath: ["input", "age"],
				message: "Must be greater than 18.",
			},
			{
				argumentPath: ["input", "username"],
				message: "Must be smaller than or equal to 25 characters.",
			},
			{
				argumentPath: ["input", "favoriteFood", 2],
				message: "Must be at least 1 character long.",
			},
		],
	},
});
```
