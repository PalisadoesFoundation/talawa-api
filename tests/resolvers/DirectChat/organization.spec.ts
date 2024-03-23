import "dotenv/config";
import type mongoose from "mongoose";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Organization } from "../../../src/models";
import { organization as organizationResolver } from "../../../src/resolvers/DirectChat/organization";
import { connect, disconnect } from "../../helpers/db";
import type { TestDirectChatType } from "../../helpers/directChat";
import { createTestDirectChat } from "../../helpers/directChat";

let testDirectChat: TestDirectChatType;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const userOrgChat = await createTestDirectChat();
  testDirectChat = userOrgChat[2];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> DirectChat -> organization", () => {
  it(`returns user object for parent.organization`, async () => {
    const parent = testDirectChat?.toObject();
    if (!parent) {
      throw new Error("Parent object is undefined.");
    }

    const organizationPayload = await organizationResolver?.(parent, {}, {});

    const organization = await Organization.findOne({
      _id: testDirectChat?.organization,
    }).lean();

    expect(organizationPayload).toEqual(organization);
  });

  it(`returns user object for parent.organization`, async () => {
    const parent = testDirectChat?.toObject();
    if (!parent) {
      throw new Error("Parent object is undefined.");
    }

    const organizationPayload = await organizationResolver?.(parent, {}, {});

    const organization = await Organization.findOne({
      _id: testDirectChat?.organization,
    }).lean();

    expect(organizationPayload).toEqual(organization);
  });
});
