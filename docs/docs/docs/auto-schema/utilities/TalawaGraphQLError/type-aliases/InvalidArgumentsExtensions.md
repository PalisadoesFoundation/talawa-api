[Admin Docs](/)

***

# Type Alias: InvalidArgumentsExtensions

> **InvalidArgumentsExtensions**: `object`

Defined in: [src/utilities/TalawaGraphQLError.ts:121](https://github.com/PratapRathi/talawa-api/blob/8be1a1231af103d298d6621405c956dc45d3a73a/src/utilities/TalawaGraphQLError.ts#L121)

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
