[API Docs](/)

***

# Function: zParseOrThrow()

> **zParseOrThrow**\<`TSchema`\>(`schema`, `data`): `Promise`\<`output`\<`TSchema`\>\>

Defined in: [src/graphql/validators/helpers.ts:62](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/validators/helpers.ts#L62)

Validates data against a Zod schema and throws a TalawaGraphQLError if validation fails.

This helper eliminates boilerplate validation code in GraphQL resolvers by:
1. Running async validation with Zod's safeParseAsync
2. Mapping Zod validation errors to TalawaGraphQLError with the `invalid_arguments` code
3. Formatting error issues with argumentPath and message for client consumption

## Type Parameters

### TSchema

`TSchema` *extends* `ZodType`\<`unknown`, `unknown`, `$ZodTypeInternals`\<`unknown`, `unknown`\>\>

## Parameters

### schema

`TSchema`

The Zod schema to validate against

### data

`unknown`

The data to validate (typically resolver args)

## Returns

`Promise`\<`output`\<`TSchema`\>\>

The parsed and validated data with TypeScript type inference

## Throws

TalawaGraphQLError When validation fails, with code "invalid_arguments"

## Examples

```ts
// In a GraphQL resolver
import { zParseOrThrow } from "~/src/graphql/validators/helpers";
import { createPostInput } from "~/src/graphql/validators/core";

const mutationCreatePostArgumentsSchema = z.object({
  input: createPostInput,
});

export const Mutation_createPost = {
  resolve: async (_parent, args, ctx) => {
    const parsedArgs = await zParseOrThrow(
      mutationCreatePostArgumentsSchema,
      args
    );

    // parsedArgs is now typed and validated
    // ...rest of resolver logic
  },
};
```

```ts
// Error handling example
try {
  const data = await zParseOrThrow(schema, userInput);
} catch (error) {
  // error is a TalawaGraphQLError with:
  // {
  //   extensions: {
  //     code: "invalid_arguments",
  //     issues: [
  //       { argumentPath: ["input", "title"], message: "Title too long" }
  //     ]
  //   }
  // }
}
```
