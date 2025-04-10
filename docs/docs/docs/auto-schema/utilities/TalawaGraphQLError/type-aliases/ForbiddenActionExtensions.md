[Admin Docs](/)

***

# Type Alias: ForbiddenActionExtensions

> **ForbiddenActionExtensions** = `object`

Defined in: [src/utilities/TalawaGraphQLError.ts:51](https://github.com/PurnenduMIshra129th/talawa-api/blob/6dd1cb0af1891b88aa61534ec8a6180536cd264f/src/utilities/TalawaGraphQLError.ts#L51)

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

Defined in: [src/utilities/TalawaGraphQLError.ts:52](https://github.com/PurnenduMIshra129th/talawa-api/blob/6dd1cb0af1891b88aa61534ec8a6180536cd264f/src/utilities/TalawaGraphQLError.ts#L52)
