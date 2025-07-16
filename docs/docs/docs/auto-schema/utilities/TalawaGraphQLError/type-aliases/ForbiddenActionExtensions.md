[Admin Docs](/)

***

# Type Alias: ForbiddenActionExtensions

> **ForbiddenActionExtensions** = `object`

Defined in: [src/utilities/TalawaGraphQLError.ts:51](https://github.com/gautam-divyanshu/talawa-api/blob/7e7d786bbd7356b22a3ba5029601eed88ff27201/src/utilities/TalawaGraphQLError.ts#L51)

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

Defined in: [src/utilities/TalawaGraphQLError.ts:52](https://github.com/gautam-divyanshu/talawa-api/blob/7e7d786bbd7356b22a3ba5029601eed88ff27201/src/utilities/TalawaGraphQLError.ts#L52)
