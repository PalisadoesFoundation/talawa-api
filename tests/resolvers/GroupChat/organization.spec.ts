import "dotenv/config";
import { organization as organizationResolver } from "../../../src/resolvers/GroupChat/organization";
import { connect, disconnect } from "../../helpers/db";
import mongoose from "mongoose";
import { Organization } from "../../../src/models";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import {
  createTestGroupChat,
  testGroupChatType,
} from "../../helpers/groupChat";

let testGroupChat: testGroupChatType;
let MONGOOSE_INSTANCE: typeof mongoose | null;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const resultArray = await createTestGroupChat();
  testGroupChat = resultArray[2];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE!);
});

describe("resolvers -> GroupChat -> organization", () => {
  it(`returns user objects for parent.organization`, async () => {
    const parent = testGroupChat!.toObject();

    const organizationPayload = await organizationResolver?.(parent, {}, {});

    const organization = await Organization.findOne({
      _id: testGroupChat!.organization,
    }).lean();

    expect(organizationPayload).toEqual(organization);
  });
});
