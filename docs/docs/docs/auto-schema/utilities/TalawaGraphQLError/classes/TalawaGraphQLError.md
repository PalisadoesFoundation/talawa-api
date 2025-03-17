[Admin Docs](/)

***

# Class: TalawaGraphQLError

Defined in: [src/utilities/TalawaGraphQLError.ts:264](https://github.com/PalisadoesFoundation/talawa-api/blob/f1b6ec0d386e11c6dc4f3cf8bb763223ff502e1e/src/utilities/TalawaGraphQLError.ts#L264)

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

### new TalawaGraphQLError()

> **new TalawaGraphQLError**(`__namedParameters`): [`TalawaGraphQLError`](TalawaGraphQLError.md)

Defined in: [src/utilities/TalawaGraphQLError.ts:265](https://github.com/PalisadoesFoundation/talawa-api/blob/f1b6ec0d386e11c6dc4f3cf8bb763223ff502e1e/src/utilities/TalawaGraphQLError.ts#L265)

#### Parameters

##### \_\_namedParameters

`GraphQLErrorOptions` & `object`

#### Returns

[`TalawaGraphQLError`](TalawaGraphQLError.md)

#### Overrides

`GraphQLError.constructor`
