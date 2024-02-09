// import { ApolloServer } from "@apollo/server";
// import { makeExecutableSchema } from "@graphql-tools/schema";
// import "dotenv/config";
// import express from "express";
// import { gql } from "graphql-tag";
// import i18n from "i18n";
// import type mongoose from "mongoose";
// import { Types } from "mongoose";
// import { nanoid } from "nanoid";
// import { afterAll, beforeAll, expect, it } from "vitest";
// import { appConfig } from "../../../src/config";
// import { USER_NOT_FOUND_ERROR } from "../../../src/constants";
// import authDirectiveTransformer from "../../../src/directives/directiveTransformer/authDirectiveTransformer";
// import roleDirectiveTransformer from "../../../src/directives/directiveTransformer/roleDirectiveTransformer";
// import { errors } from "../../../src/libraries";
// import { AppUserProfile, User } from "../../../src/models";
// import { connect, disconnect } from "../../helpers/db";
// import { TestUserType } from "../../helpers/userAndOrg";

// let MONGOOSE_INSTANCE: typeof mongoose;

// const app = express();
// i18n.configure({
//   directory: `${__dirname}/locales`,
//   staticCatalog: {
//     en: require("../../../locales/en.json"),
//     hi: require("../../../locales/hi.json"),
//     zh: require("../../../locales/zh.json"),
//     sp: require("../../../locales/sp.json"),
//     fr: require("../../../locales/fr.json"),
//   },
//   queryParameter: "lang",
//   defaultLocale: appConfig.defaultLocale,
//   locales: appConfig.supportedLocales,
//   autoReload: process.env.NODE_ENV !== "production",
//   updateFiles: process.env.NODE_ENV !== "production",
//   syncFiles: process.env.NODE_ENV !== "production",
// });
// app.use(i18n.init);

// let testUser: TestUserType;

// const typeDefs = gql`
//   directive @role(requires: String) on FIELD_DEFINITION

//   type Query {
//     hello: String @role(requires: "ADMIN")
//   }
// `;

// const resolvers = {
//   Query: {
//     hello: (): string => "hi",
//   },
// };

// beforeAll(async () => {
//   MONGOOSE_INSTANCE = await connect();

//   testUser = await User.create({
//     userId: Types.ObjectId().toString(),
//     email: `email${nanoid().toLowerCase()}@gmail.com`,
//     password: "password",
//     firstName: "firstName",
//     lastName: "lastName",
//     appLanguageCode: "en",
//     userType: "ADMIN",
//   });
//   await AppUserProfile.create({
//     userId: testUser._id,
//   });
// });

// afterAll(async () => {
//   await testUser?.remove();
//   await disconnect(MONGOOSE_INSTANCE);
// });

// it("throws NotFoundError if no user exists with _id === context.userId", async () => {
//   const query = `
//     query {
//       hello
//     }
//   `;
//   const authenticatedContext = {
//     userId: Types.ObjectId().toString(),
//     userType: testUser?.userType,
//   };
//   let schema = makeExecutableSchema({
//     typeDefs,
//     resolvers,
//   });
//   // defines directives
//   schema = authDirectiveTransformer(schema, "auth");
//   schema = roleDirectiveTransformer(schema, "role");
//   const apolloServer = new ApolloServer({
//     schema,
//   });

//   try {
//     await apolloServer.executeOperation(
//       {
//         query,
//         variables: {},
//       },
//       {
//         contextValue: authenticatedContext,
//       }
//     );
//   } catch (err) {
//     if (err instanceof errors.NotFoundError) {
//       expect(err.message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
//     }
//   }
// });

// it("throws UnauthenticatedError if user exists but userType != requires", async () => {
//   const query = `
//     query {
//       hello
//     }
//   `;
//   testUser.userType = "USER";
//   await testUser.save();
//   const authenticatedContext = {
//     userId: testUser._id,
//     userType: testUser.userType,
//   };
//   let schema = makeExecutableSchema({
//     typeDefs,
//     resolvers,
//   });
//   // defines directives
//   schema = authDirectiveTransformer(schema, "auth");
//   schema = roleDirectiveTransformer(schema, "role");
//   const apolloServer = new ApolloServer({
//     schema,
//   });

//   try {
//     await apolloServer.executeOperation(
//       {
//         query,
//         variables: {},
//       },
//       {
//         contextValue: authenticatedContext,
//       }
//     );

//     expect(result.body.singleResult.data).toEqual({ hello: "hi" });
//   } catch (err) {
//     if (err instanceof errors.UnauthenticatedError) {
//       expect(err.message).toEqual("user.notAuthenticated");
//     }
//   }
// });

// it("returns data if user exists and userType === requires", async () => {
//   const query = `
//     query {
//       hello
//     }
//   `;
//   testUser.userType = "ADMIN";
//   await testUser.save();
//   const authenticatedContext = {
//     userId: testUser._id,
//     userType: testUser.userType,
//   };
//   let schema = makeExecutableSchema({
//     typeDefs,
//     resolvers,
//   });
//   // defines directives
//   schema = authDirectiveTransformer(schema, "auth");
//   schema = roleDirectiveTransformer(schema, "role");
//   const apolloServer = new ApolloServer({
//     schema,
//   });

//   const result = await apolloServer.executeOperation(
//     {
//       query,
//       variables: {},
//     },
//     {
//       contextValue: authenticatedContext,
//     }
//   );

//   expect(result.body.singleResult.data).toEqual({ hello: "hi" });
// });

// it("checks if the resolver is supplied, and return null data, if not", async () => {
//   const query = `
//       query {
//         hello
//       }
//     `;
//   testUser.userType = "ADMIN";
//   await testUser.save();
//   const authenticatedContext = {
//     userId: testUser._id,
//     userType: testUser.userType,
//   };
//   let schema = makeExecutableSchema({
//     typeDefs,
//     resolvers,
//   });
//   // defines directives
// schema = authDirectiveTransformer(schema, "auth");
//   schema = roleDirectiveTransformer(schema, "role");
//   const apolloServer = new ApolloServer({
//     schema,
//   });

//   const result = await apolloServer.executeOperation(
//     {
//       query,
//       variables: {},
//     },
//     {
//       contextValue: authenticatedContext,
//     }
//   );

//   expect(result.body.singleResult.data).toEqual({ hello: "hi" });
// });
