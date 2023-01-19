import "dotenv/config";
import { Document, Types } from "mongoose";
import { requestContext } from "../../../src/lib/libraries";
import {
  Interface_User,
  User,
  Organization,
  Interface_Organization,
} from "../../../src/lib/models";
import { MutationCreateDirectChatArgs } from "../../../src/generated/graphqlCodegen";
import { connect, disconnect } from "../../../src/db";
import { createDirectChat as createDirectChatResolver } from "../../../src/lib/resolvers/Mutation/createDirectChat";
import { ORGANIZATION_NOT_FOUND, USER_NOT_FOUND ,IN_PRODUCTION} from "../../../src/constants";
import { nanoid } from "nanoid";
import { beforeAll, afterAll, describe, it, expect } from "vitest";

let testUser: Interface_User & Document<any, any, Interface_User>;
let testOrganization: Interface_Organization &
  Document<any, any, Interface_Organization>;

beforeAll(async () => {
  await connect();

  testUser = await User.create({
    email: `email${nanoid().toLowerCase()}@gmail.com`,
    password: "password",
    firstName: "firstName",
    lastName: "lastName",
    appLanguageCode: "en",
  });

  testOrganization = await Organization.create({
    name: "name",
    description: "description",
    isPublic: true,
    creator: testUser._id,
    admins: [testUser._id],
    members: [testUser._id],
  });

  await User.updateOne(
    {
      _id: testUser._id,
    },
    {
      $set: {
        createdOrganizations: [testOrganization._id],
        adminFor: [testOrganization._id],
        joinedOrganizations: [testOrganization._id],
      },
    }
  );
});

afterAll(async () => {
  await disconnect();
});

describe("resolvers -> Mutation -> createDirectChat", () => {
  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    try {
      const args: MutationCreateDirectChatArgs = {
        data: {
          organizationId: "",
          userIds: [],
        },
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      await createDirectChatResolver?.({}, args, context);
    } catch (error: any) {
      if ( IN_PRODUCTION !== true) {
        expect(error.message).toEqual(USER_NOT_FOUND);
      }else{
      requestContext.translate(USER_NOT_FOUND_MESSAGE),
      }
    }
  });

  it(`throws NotFoundError if no organization exists with _id === args.data.organizationId`, async () => {
    try {
      const args: MutationCreateDirectChatArgs = {
        data: {
          organizationId: Types.ObjectId().toString(),
          userIds: [],
        },
      };

      const context = {
        userId: testUser.id,
      };

      await createDirectChatResolver?.({}, args, context);
    } catch (error: any) {
      if ( IN_PRODUCTION !== true) {
        expect(error.message).toEqual(ORGANIZATION_NOT_FOUND);
      }else{
      requestContext.translate(ORGANIZATION_NOT_FOUND_MESSAGE)
      }
      
    }
  });

  it(`throws NotFoundError if no user exists for any one of the ids in args.data.userIds`, async () => {
    try {
      const args: MutationCreateDirectChatArgs = {
        data: {
          organizationId: testOrganization.id,
          userIds: [Types.ObjectId().toString()],
        },
      };

      const context = {
        userId: testUser.id,
      };

      await createDirectChatResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
    }
  });

  it(`creates the directChat and returns it`, async () => {
    const args: MutationCreateDirectChatArgs = {
      data: {
        organizationId: testOrganization.id,
        userIds: [testUser.id],
      },
    };

    const context = {
      userId: testUser.id,
    };

    const createDirectChatPayload = await createDirectChatResolver?.(
      {},
      args,
      context
    );

    expect(createDirectChatPayload).toEqual(
      expect.objectContaining({
        creator: testUser._id,
        users: [testUser._id],
        organization: testOrganization._id,
      })
    );
  });
});
