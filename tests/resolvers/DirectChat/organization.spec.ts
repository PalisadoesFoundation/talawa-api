import "dotenv/config";
import { organization as organizationResolver } from "../../../src/resolvers/DirectChat/organization";
import {
  connect,
  disconnect,
  dropAllCollectionsFromDatabase,
} from "../../helpers/db";
import mongoose from "mongoose";
import { Organization } from "../../../src/models";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createTestDirectChat,
  testDirectChatType,
} from "../../helpers/directChat";

let testDirectChat: testDirectChatType;
let MONGOOSE_INSTANCE: typeof mongoose | null;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  await dropAllCollectionsFromDatabase(MONGOOSE_INSTANCE!);
  const userOrgChat = await createTestDirectChat();
  testDirectChat = userOrgChat[2];
});

afterAll(async () => {
  await dropAllCollectionsFromDatabase(MONGOOSE_INSTANCE!);
  await disconnect(MONGOOSE_INSTANCE!);
});

describe("resolvers -> DirectChat -> organization", () => {
  it(`returns user object for parent.organization`, async () => {
    const parent = testDirectChat!.toObject();

    const organizationPayload = await organizationResolver?.(parent, {}, {});

    const organization = await Organization.findOne({
      _id: testDirectChat!.organization,
    }).lean();

    expect(organizationPayload).toEqual(organization);
  });
});
