import { createSchema } from "graphql-yoga";
import authDirectiveTransformer from "../../directives/directiveTransformer/authDirectiveTransformer";
import roleDirectiveTransformer from "../../directives/directiveTransformer/roleDirectiveTransformer";
import { composedResolvers as resolvers } from "../../resolvers";
import { typeDefs } from "../../typeDefs";

/**
 * This is the executable schema for the graphQL server.
 */
export const schema = roleDirectiveTransformer(
  authDirectiveTransformer(
    createSchema({
      typeDefs,
      resolvers,
    }),
    "auth",
  ),
  "role",
);
