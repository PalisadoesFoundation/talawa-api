[Admin Docs](/)

***

# Type Alias: ArgumentsAssociatedResourcesNotFoundExtensions

> **ArgumentsAssociatedResourcesNotFoundExtensions** = `object`

Defined in: [src/utilities/TalawaGraphQLError.ts:32](https://github.com/Sourya07/talawa-api/blob/61a1911602b2f0aac7635e08ae2918f4f768e8ff/src/utilities/TalawaGraphQLError.ts#L32)

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

Defined in: [src/utilities/TalawaGraphQLError.ts:33](https://github.com/Sourya07/talawa-api/blob/61a1911602b2f0aac7635e08ae2918f4f768e8ff/src/utilities/TalawaGraphQLError.ts#L33)

***

### issues

> **issues**: `object`[]

Defined in: [src/utilities/TalawaGraphQLError.ts:34](https://github.com/Sourya07/talawa-api/blob/61a1911602b2f0aac7635e08ae2918f4f768e8ff/src/utilities/TalawaGraphQLError.ts#L34)

#### argumentPath

> **argumentPath**: (`string` \| `number`)[]
