[Admin Docs](/)

***

# Type Alias: ForbiddenActionExtensions

> **ForbiddenActionExtensions**: `object`

Defined in: [src/utilities/TalawaGraphQLError.ts:51](https://github.com/Suyash878/talawa-api/blob/05d9dfc8d9c5928ef559c72f2ab0492d0dbbb48c/src/utilities/TalawaGraphQLError.ts#L51)

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
