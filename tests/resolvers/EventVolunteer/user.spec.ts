import "dotenv/config";
import { user as userResolver } from "../../../src/resolvers/EventVolunteer/user";
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
let testUser: TestUserType;
let testEventVolunteer: TestEventVolunteerType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [testUser, , , testEventVolunteer] = await createTestEventAndVolunteer();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> EventVolunteer -> user", () => {
  beforeEach(() => {
    vi.resetModules();
  });
  it(`returns the correct user object for parent event volunteer`, async () => {
    const parent = testEventVolunteer?.toObject();
    console.log(testEventVolunteer?.userId);
    console.log(testUser?._id);

    const userPayload = await userResolver?.(
      parent as InterfaceEventVolunteer,
      {},
      {},
    );

    expect(userPayload).toEqual({
      ...testUser?.toObject(),
      updatedAt: expect.anything(),
    });
  });
});
