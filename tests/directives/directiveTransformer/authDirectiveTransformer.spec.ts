import { beforeAll, afterAll, it, expect } from "vitest";
import { ApolloServer } from "@apollo/server";
import { gql } from "graphql-tag";
import "dotenv/config";
import i18n from "i18n";
import express from "express";
// import type { TestUserType } from "../../helpers/userAndOrg";
// import { createTestUserFunc } from "../../helpers/user";
import { makeExecutableSchema } from "@graphql-tools/schema";
import authDirectiveTransformer from "../../../src/directives/directiveTransformer/authDirectiveTransformer";
import roleDirectiveTransformer from "../../../src/directives/directiveTransformer/roleDirectiveTransformer";
import { appConfig } from "../../../src/config";
import { errors } from "../../../src/libraries";
import { BaseTest } from "../../helpers/testHelper/baseTest";
import enLocale from "../../../locales/en.json";
import hiLocale from "../../../locales/hi.json";
import zhLocale from "../../../locales/zh.json";
import spLocale from "../../../locales/sp.json";
import frLocale from "../../../locales/fr.json";

const app = express();
i18n.configure({
  directory: `${__dirname}/locales`,
  staticCatalog: {
    en: enLocale,
    hi: hiLocale,
    zh: zhLocale,
    sp: spLocale,
    fr: frLocale,
  },
  queryParameter: "lang",
  defaultLocale: appConfig.defaultLocale,
  locales: appConfig.supportedLocales,
  autoReload: process.env.NODE_ENV !== "production",
  updateFiles: process.env.NODE_ENV !== "production",
  syncFiles: process.env.NODE_ENV !== "production",
});
app.use(i18n.init);

// let testUser: TestUserType;

const typeDefs = gql`
  directive @auth on FIELD_DEFINITION

  type Query {
    hello: String @auth
  }
`;

const resolvers = {
  Query: {
    hello: (): string => "hi",
  },
};

let testInstance: BaseTest;
let testData: {
  testUser: { name: string; email: string };
  testOrg: { name: string };
};
beforeAll(async () => {
  testInstance = new BaseTest();
  testData = await testInstance.beforeEach();
});

afterAll(async () => {
  await testInstance.afterEach();
});

it("throws UnauthenticatedError when context is expired", async () => {
  const query = `
    query {
      hello
    }
  `;
  const authenticatedContext = {
    expired: true,
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
    if (err instanceof errors.UnauthenticatedError) {
      expect(err.message).toEqual("user.notAuthenticated");
    }
  }
});

it("throws UnauthenticatedError when context: isAuth == false", async () => {
  const query = `
    query {
      hello
    }
  `;
  const authenticatedContext = {
    isAuth: false,
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
    if (err instanceof errors.UnauthenticatedError) {
      expect(err.message).toEqual("user.notAuthenticated");
    }
  }
});

it("checks if the resolver is supplied, and return null data, if not", async () => {
  const query = `
      query {
        hello
      }
    `;
  const authenticatedContext = {
    expired: true,
    isAuth: false,
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

  const result = await apolloServer.executeOperation(
    {
      query,
      variables: {},
    },
    {
      contextValue: authenticatedContext,
    },
  );

  //@ts-expect-error-ts-ignore
  expect(result.body.singleResult.data).toEqual({ hello: null });
});

test("should use testData in a meaningful way", () => {
  expect(testData.testUser.name).toBeDefined();
  expect(testData.testUser.email).toMatch(/@test.com$/);
  expect(testData.testOrg.name).toContain("org");
});

it("returns data if isAuth == true and expire == false", async () => {
  const query = `
    query {
      hello
    }
  `;
  const authenticatedContext = {
    expired: false,
    isAuth: true,
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

  const result = await apolloServer.executeOperation(
    {
      query,
      variables: {},
    },
    {
      contextValue: authenticatedContext,
    },
  );
  //@ts-expect-error-ignore
  expect(result.body.singleResult.data).toEqual({ hello: "hi" });
});
