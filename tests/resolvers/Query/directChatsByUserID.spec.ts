import "dotenv/config";
import { Document, Types } from "mongoose";
import { connect, disconnect } from "../../../src/db";
import { directChatsByUserID as directChatsByUserIDResolver } from "../../../src/resolvers/Query/directChatsByUserID";
import {
  User,
  Organization,
  DirectChat,
  Interface_User,
} from "../../../src/models";
import { nanoid } from "nanoid";
import { QueryDirectChatsByUserIdArgs } from "../../../src/types/generatedGraphQLTypes";
import { beforeAll, afterAll, describe, it, expect } from "vitest";

let testUser: Interface_User & Document<any, any, Interface_User>;

beforeAll(async () => {
  await connect("TALAWA_TESING_DB");

  testUser = await User.create({
    email: `email${nanoid().toLowerCase()}@gmail.com`,
    password: "password",
    firstName: "firstName",
    lastName: "lastName",
    appLanguageCode: "en",
  });

  const testOrganization = await Organization.create({
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

  await DirectChat.create({
    creator: testUser._id,
    organization: testOrganization._id,
    users: [testUser._id],
  });
});

afterAll(async () => {
  await disconnect();
});

describe("resolvers -> Query -> directChatsByUserID", () => {
  it(`throws NotFoundError if no directChats exists with directChats.users
  containing user with _id === args.id`, async () => {
    try {
      const args: QueryDirectChatsByUserIdArgs = {
        id: Types.ObjectId().toString(),
      };

      await directChatsByUserIDResolver?.({}, args, {});
    } catch (error: any) {
      expect(error.message).toEqual("DirectChats not found");
    }
  });

  it(`returns list of all directChats with directChat.users containing the user
  with _id === args.id`, async () => {
    const args: QueryDirectChatsByUserIdArgs = {
      id: testUser._id,
    };

    const directChatsByUserIdPayload = await directChatsByUserIDResolver?.(
      {},
      args,
      {}
    );

    const directChatsByUserId = await DirectChat.find({
      users: testUser._id,
    }).lean();

    expect(directChatsByUserIdPayload).toEqual(directChatsByUserId);
  });
});
