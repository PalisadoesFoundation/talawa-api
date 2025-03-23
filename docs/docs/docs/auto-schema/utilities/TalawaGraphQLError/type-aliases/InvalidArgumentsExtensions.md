[Admin Docs](/)

***

# Type Alias: InvalidArgumentsExtensions

> **InvalidArgumentsExtensions**: `object`

Defined in: [src/utilities/TalawaGraphQLError.ts:121](https://github.com/NishantSinghhhhh/talawa-api/blob/92ff044a4e2bbc8719de2b33b4f8d7d0a9aa0174/src/utilities/TalawaGraphQLError.ts#L121)

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
