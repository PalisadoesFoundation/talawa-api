import "dotenv/config";
import { creator as creatorResolver } from "../../../src/resolvers/EventVolunteer/creator";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import {
  beforeAll,
  afterAll,
  describe,
  it,
  expect,
  beforeEach,
  vi,
} from "vitest";
import type { TestEventVolunteerType } from "../../helpers/events";
import { createTestEventAndVolunteer } from "../../helpers/events";
import type { TestUserType } from "../../helpers/userAndOrg";
import type { InterfaceEventVolunteer } from "../../../src/models";

let MONGOOSE_INSTANCE: typeof mongoose;
let testEventVolunteer: TestEventVolunteerType;
let creatorUser: TestUserType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [, creatorUser, , testEventVolunteer] = await createTestEventAndVolunteer();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> EventVolunteer -> user", () => {
  beforeEach(() => {
    vi.resetModules();
  });
  it(`returns the correct creator object for parent event volunteer`, async () => {
    const parent = testEventVolunteer?.toObject();
    const creatorPayload = await creatorResolver?.(
      parent as InterfaceEventVolunteer,
      {},
      {}
    );

    expect(creatorPayload?._id).toEqual(creatorUser?._id);
  });
});
