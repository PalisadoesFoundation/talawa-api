[Admin Docs](/)

***

# Type Alias: ForbiddenActionExtensions

> **ForbiddenActionExtensions**: `object`

Defined in: [src/utilities/TalawaGraphQLError.ts:51](https://github.com/PalisadoesFoundation/talawa-api/blob/1251c45d69620e1317cb8632c6decbdb7edbdb06/src/utilities/TalawaGraphQLError.ts#L51)

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
