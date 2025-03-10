[Admin Docs](/)

***

# Type Alias: ForbiddenActionExtensions

> **ForbiddenActionExtensions**: `object`

Defined in: [src/utilities/TalawaGraphQLError.ts:51](https://github.com/PratapRathi/talawa-api/blob/8c6154f4daaa502448d207545feda14b4d146e99/src/utilities/TalawaGraphQLError.ts#L51)

When the client tries to perform an action that conflicts with real world expectations of the application.

## Type declaration

### code

> **code**: `"forbidden_action"`

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
