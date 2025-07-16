[Admin Docs](/)

***

# Type Alias: ArgumentsAssociatedResourcesNotFoundExtensions

> **ArgumentsAssociatedResourcesNotFoundExtensions** = `object`

Defined in: [src/utilities/TalawaGraphQLError.ts:32](https://github.com/gautam-divyanshu/talawa-api/blob/7e7d786bbd7356b22a3ba5029601eed88ff27201/src/utilities/TalawaGraphQLError.ts#L32)

When resources associated to the provided graphql arguments cannot be not found.

## Example

```ts
throw new TalawaGraphQLError({
	extensions: {
		code: "arguments_associated_resources_not_found",
		issues: [
			{
				argumentPath: ["input", 0, "id"],
			},
			{
				argumentPath: ["input", 3, "id"],
			},
			{
				argumentPath: ["input", 19, "id"],
			},
		],
	},
});
```

## Properties

### code

> **code**: `"arguments_associated_resources_not_found"`

Defined in: [src/utilities/TalawaGraphQLError.ts:33](https://github.com/gautam-divyanshu/talawa-api/blob/7e7d786bbd7356b22a3ba5029601eed88ff27201/src/utilities/TalawaGraphQLError.ts#L33)

***

### issues

> **issues**: `object`[]

Defined in: [src/utilities/TalawaGraphQLError.ts:34](https://github.com/gautam-divyanshu/talawa-api/blob/7e7d786bbd7356b22a3ba5029601eed88ff27201/src/utilities/TalawaGraphQLError.ts#L34)

#### argumentPath

> **argumentPath**: (`string` \| `number`)[]
