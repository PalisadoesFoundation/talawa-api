import { ApolloServer } from "apollo-server";
import {
  ApolloServerPluginLandingPageLocalDefault,
} from "apollo-server-core";
import "dotenv/config"; // pull env variables from .env file
import { typeDefs } from "./typeDefs";
import { resolvers } from "./resolvers";
import {
  AuthenticationDirective,
  RoleAuthorizationDirective,
} from "./directives";
import { isAuth } from "./middleware";
import { PubSub } from "apollo-server-express";
import * as database from "./db";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { MapperKind, getDirective, mapSchema } from "@graphql-tools/utils";
import { GraphQLField, GraphQLFieldConfig } from "graphql";
import { errors, requestContext } from "./libraries";

const pubsub = new PubSub();

//@ts-ignore
function directiveTransformer(schema , directiveName) {
  return mapSchema(schema, {

    [MapperKind.OBJECT_FIELD]:(fieldConfig:GraphQLFieldConfig<any, any>):any => {

      // Check whether this field has the specified directive
      const authDirective = getDirective(schema, fieldConfig, directiveName)?.[0];
      if (authDirective) {

        //@ts-ignore
        const { resolve = defaultFieldResolver } = fieldConfig;

        fieldConfig.resolve = (root, args, context, info): string => {
          if (context.expired || !context.isAuth)
            throw new errors.UnauthenticatedError(
              requestContext.translate("user.notAuthenticated"),
              "user.notAuthenticated",
              "userAuthentication"
            );
          return resolve(root, args, context, info);
        };
        return fieldConfig;
      }
    }

  })
}

let schema = makeExecutableSchema({
  typeDefs,
  resolvers
});

schema = directiveTransformer(schema  , 'auth');

const server = new ApolloServer({
  schema,

  // schemaDirectives: {
  //   auth: AuthenticationDirective,
  //   role: RoleAuthorizationDirective,
  // },
  context: ({
    req,
    res,
    connection,
  }: {
    req: any;
    res: any;
    connection: any;
  }): any => {
    const apiRootUrl = `${req.protocol}://${req.get("host")}/`;
    if (connection) {
      return {
        ...connection,
        pubsub,
        res,
        req,
        apiRootUrl,
      };
    } else {
      return {
        ...isAuth(req),
        pubsub,
        res,
        req,
        apiRootUrl,
      };
    }
  },
  csrfPrevention: true,
  cache: "bounded",
  plugins: [ApolloServerPluginLandingPageLocalDefault({ embed: true })],
});

async function startServer():Promise<void> {
  await database.connect();

  server.listen().then(({ url }: { url: string }) => {
    console.log(`🚀  Server ready at ${url}`);
  });
}

startServer();