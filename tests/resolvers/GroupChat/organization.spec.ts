import "dotenv/config";
import { organization as organizationResolver } from "../../../src/resolvers/GroupChat/organization";
import { connect, disconnect } from "../../../src/db";
import { Organization } from "../../../src/models";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import {
  createTestGroupChatMessage,
  testGroupChatMessageType,
} from "../../helpers/groupChat";

let testGroupChat: testGroupChatMessageType;

beforeAll(async () => {
  await connect("TALAWA_TESING_DB");
  const resultArray = await createTestGroupChatMessage();
  testGroupChat = resultArray[3];
});

afterAll(async () => {
  await disconnect();
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
