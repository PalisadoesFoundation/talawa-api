[Admin Docs](/)

***

# Type Alias: InvalidArgumentsExtensions

> **InvalidArgumentsExtensions** = `object`

Defined in: [src/utilities/TalawaGraphQLError.ts:121](https://github.com/gautam-divyanshu/talawa-api/blob/7e7d786bbd7356b22a3ba5029601eed88ff27201/src/utilities/TalawaGraphQLError.ts#L121)

When the client provides invalid arguments in a graphql operation.

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

## Properties

### code

> **code**: `"invalid_arguments"`

Defined in: [src/utilities/TalawaGraphQLError.ts:122](https://github.com/gautam-divyanshu/talawa-api/blob/7e7d786bbd7356b22a3ba5029601eed88ff27201/src/utilities/TalawaGraphQLError.ts#L122)

***

### issues

> **issues**: `object`[]

Defined in: [src/utilities/TalawaGraphQLError.ts:123](https://github.com/gautam-divyanshu/talawa-api/blob/7e7d786bbd7356b22a3ba5029601eed88ff27201/src/utilities/TalawaGraphQLError.ts#L123)

#### argumentPath

> **argumentPath**: (`string` \| `number`)[]

#### message

> **message**: `string`
