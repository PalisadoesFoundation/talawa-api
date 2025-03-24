[Admin Docs](/)

***

# Type Alias: ArgumentsAssociatedResourcesNotFoundExtensions

> **ArgumentsAssociatedResourcesNotFoundExtensions**: `object`

Defined in: [src/utilities/TalawaGraphQLError.ts:32](https://github.com/NishantSinghhhhh/talawa-api/blob/392788fe2d27c588c46069b772af4fd307c1489d/src/utilities/TalawaGraphQLError.ts#L32)

When resources associated to the provided graphql arguments cannot be not found.

## Type declaration

### code

> **code**: `"arguments_associated_resources_not_found"`

### issues

> **issues**: `object`[]

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
