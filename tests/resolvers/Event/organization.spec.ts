import "dotenv/config";
import { organization as attendeesResolver } from "../../../src/resolvers/Event/organization";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { createTestEventWithRegistrants } from "../../helpers/eventsWithRegistrants";
import type { TestEventType } from "../../helpers/events";
import { Organization } from "../../../src/models";
import { type TestOrganizationType } from "../../helpers/userAndOrg";

let MONGOOSE_INSTANCE: typeof mongoose;
let testOrg: TestOrganizationType;
let testEvent: TestEventType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [, testOrg, testEvent] = await createTestEventWithRegistrants();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Event -> organization", () => {
  it(`returns the organization object for parent event`, async () => {
    const parent = testEvent?.toObject();
    if (!parent) {
      throw new Error("Parent object is undefined.");
    }

    const orgPayload = await attendeesResolver?.(parent, {}, {});

    const orgObject = await Organization.findOne({
      _id: testOrg?._id,
    }).lean();

    expect(orgPayload).toEqual(orgObject);
  });
});
