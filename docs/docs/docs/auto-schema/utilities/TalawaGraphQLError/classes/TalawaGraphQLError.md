[Admin Docs](/)

***

# Class: TalawaGraphQLError

<<<<<<< HEAD
=======
Defined in: [src/utilities/TalawaGraphQLError.ts:260](https://github.com/PalisadoesFoundation/talawa-api/blob/37e2d6abe1cabaa02f97a3c6c418b81e8fcb5a13/src/utilities/TalawaGraphQLError.ts#L260)

>>>>>>> develop-postgres
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

<<<<<<< HEAD
=======
Defined in: [src/utilities/TalawaGraphQLError.ts:261](https://github.com/PalisadoesFoundation/talawa-api/blob/37e2d6abe1cabaa02f97a3c6c418b81e8fcb5a13/src/utilities/TalawaGraphQLError.ts#L261)

>>>>>>> develop-postgres
#### Parameters

##### \_\_namedParameters

`GraphQLErrorOptions` & `object`

#### Returns

[`TalawaGraphQLError`](TalawaGraphQLError.md)

#### Overrides

`GraphQLError.constructor`

#### Defined in

[src/utilities/TalawaGraphQLError.ts:261](https://github.com/NishantSinghhhhh/talawa-api/blob/ff0f1d6ae21d3428519b64e42fe3bfdff573cb6e/src/utilities/TalawaGraphQLError.ts#L261)
