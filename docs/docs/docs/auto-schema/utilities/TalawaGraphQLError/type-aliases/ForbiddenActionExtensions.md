[Admin Docs](/)

***

# Type Alias: ForbiddenActionExtensions

> **ForbiddenActionExtensions**: `object`

Defined in: [src/utilities/TalawaGraphQLError.ts:51](https://github.com/PratapRathi/talawa-api/blob/72aae1e3507e4dd8ad32a69696c05d569e0ed095/src/utilities/TalawaGraphQLError.ts#L51)

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
