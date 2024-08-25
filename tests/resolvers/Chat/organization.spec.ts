import "dotenv/config";
import { organization as organizationResolver } from "../../../src/resolvers/Chat/organization";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { Organization } from "../../../src/models";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { TestChatType } from "../../helpers/chat";
import { createTestChatMessage } from "../../helpers/chat";

let testChat: TestChatType;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const userOrgChat = await createTestChatMessage();
  testChat = userOrgChat[2];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Chat -> organization", () => {
  it(`returns user object for parent.users`, async () => {
    const parent = testChat?.toObject();
    if (!parent) {
      throw new Error("Parent object is undefined.");
    }

    const organizationPayload = await organizationResolver?.(parent, {}, {});

    const organization = await Organization.findOne({
      _id: {
        $in: testChat?.organization,
      },
    }).lean();

    expect(organizationPayload).toEqual(organization);
  });
  it(`returns user objects for parent.organization from cache`, async () => {
    const parent = testChat?.toObject();
    if (parent) {
      const organizationPayload = await organizationResolver?.(parent, {}, {});
      const organization = await Organization.findOne({
        _id: testChat?.organization,
      }).lean();

      expect(organizationPayload).toEqual(organization);
    }
  });
});