[**talawa-api**](../../../README.md)

***

# Class: TalawaGraphQLError

Defined in: [src/utilities/TalawaGraphQLError.ts:311](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/utilities/TalawaGraphQLError.ts#L311)

This class extends the `GraphQLError` class and is used to create graphql error instances with strict typescript assertion on providing the error metadata within the `extensions` field. This assertion prevents talawa api contributers from returning arbitrary, undocumented errors to the talawa api graphql clients.

This also standardizes the errors that the client developers using talawa api can expect in the graphql responses, helping them design better UI experiences for end users. If necessary, the localization of the error messages(i18n) can be done within the graphql resolvers where this function is used.

The following example shows the usage of `createTalawaGraphQLError` function within a graphql resolver for resolving the user record of the best friend of a user:

## Example

```ts
export const user = async (parent, args, ctx) => {
 const existingUser = await ctx.drizzleClient.query.user.findFirst({
     where: (fields, operators) => operators.eq(fields.id, args.input.id),
 });

	if (user === undefined) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "arguments_associated_resources_not_found",
				issues: [
					{
						argumentPath: ["input", "id"],
					},
				],
			},

     })
	}

 return user;
}
```

## Extends

- `GraphQLError`

## Constructors

### Constructor

> **new TalawaGraphQLError**(`__namedParameters`): `TalawaGraphQLError`

Defined in: [src/utilities/TalawaGraphQLError.ts:312](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/utilities/TalawaGraphQLError.ts#L312)

#### Parameters

##### \_\_namedParameters

`GraphQLErrorOptions` & `object`

#### Returns

`TalawaGraphQLError`

#### Overrides

`GraphQLError.constructor`
