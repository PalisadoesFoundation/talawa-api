[API Docs](/)

***

# Type Alias: ForbiddenActionExtensions

> **ForbiddenActionExtensions** = `object`

Defined in: src/utilities/TalawaGraphQLError.ts:51

When the client tries to perform an action that conflicts with real world expectations of the application.

## Example

```ts
throw new TalawaGraphQLError(
	{
		extensions: {
			code: "forbidden_action",
		},
	},
);
```

## Properties

### code

> **code**: `"forbidden_action"`

Defined in: src/utilities/TalawaGraphQLError.ts:52
