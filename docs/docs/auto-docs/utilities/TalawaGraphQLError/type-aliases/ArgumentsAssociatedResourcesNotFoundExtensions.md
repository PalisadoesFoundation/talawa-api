[**talawa-api**](../../../README.md)

***

# Type Alias: ArgumentsAssociatedResourcesNotFoundExtensions

> **ArgumentsAssociatedResourcesNotFoundExtensions** = `object`

Defined in: src/utilities/TalawaGraphQLError.ts:34

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

Defined in: src/utilities/TalawaGraphQLError.ts:35

***

### issues

> **issues**: `object`[]

Defined in: src/utilities/TalawaGraphQLError.ts:36

#### argumentPath

> **argumentPath**: `JSONArgumentPathKey`[]
