import { ApolloServer } from "@apollo/server";
import { makeExecutableSchema } from "@graphql-tools/schema";
import "dotenv/config";
import express from "express";
import { gql } from "graphql-tag";
import i18n from "i18n";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { nanoid } from "nanoid";
import { afterAll, beforeAll, expect, it } from "vitest";
import { appConfig } from "../../../src/config";
import { USER_NOT_FOUND_ERROR } from "../../../src/constants";
import authDirectiveTransformer from "../../../src/directives/directiveTransformer/authDirectiveTransformer";
import roleDirectiveTransformer from "../../../src/directives/directiveTransformer/roleDirectiveTransformer";
import { errors } from "../../../src/libraries";
import { User } from "../../../src/models";
import { connect, disconnect } from "../../helpers/db";
import type { TestUserType } from "../../helpers/userAndOrg";
import { encryptEmail } from "../../../src/utilities/encryption";
import { hashEmail } from "../../../src/utilities/hashEmail";
import en from "../../../locales/en.json";
import hi from "../../../locales/hi.json";
import zh from "../../../locales/zh.json";
import sp from "../../../locales/sp.json";
import fr from "../../../locales/fr.json";
let MONGOOSE_INSTANCE: typeof mongoose;

const app = express();
i18n.configure({
  directory: `${__dirname}/locales`,
  staticCatalog: {
    en,
    hi,
    zh,
    sp,
    fr,
  },
  queryParameter: "lang",
  defaultLocale: appConfig.defaultLocale,
  locales: appConfig.supportedLocales,
  autoReload: process.env.NODE_ENV !== "production",
  updateFiles: process.env.NODE_ENV !== "production",
  syncFiles: process.env.NODE_ENV !== "production",
});
app.use(i18n.init);

let testUser: TestUserType;

const typeDefs = gql`
  directive @role(requires: String) on FIELD_DEFINITION

  type Query {
    hello: String @role(requires: "ADMIN")
  }
`;

const resolvers = {
  Query: {
    hello: (): string => "hi",
  },
};

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();

  const email = `email${nanoid().toLowerCase()}@gmail.com`;
  const hashedEmail = hashEmail(email);

  testUser = await User.create({
    userId: new Types.ObjectId().toString(),
    email: encryptEmail(email),
    hashedEmail: hashedEmail,
    password: "password",
    firstName: "firstName",
    lastName: "lastName",
    appLanguageCode: "en",
  });
});

afterAll(async () => {
  await testUser?.deleteOne();
  await disconnect(MONGOOSE_INSTANCE);
});

it("throws NotFoundError if no user exists with _id === context.userId", async () => {
  const query = `
    query {
      hello
    }
  `;
  const authenticatedContext = {
    userId: new Types.ObjectId().toString(),
  };
  let schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  });
  // defines directives
  schema = authDirectiveTransformer(schema, "auth");
  schema = roleDirectiveTransformer(schema, "role");
  const apolloServer = new ApolloServer({
    schema,
  });

  try {
    await apolloServer.executeOperation(
      {
        query,
        variables: {},
      },
      {
        contextValue: authenticatedContext,
      },
    );
  } catch (err) {
    if (err instanceof errors.NotFoundError) {
      expect(err.message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  }
});
