import "dotenv/config";
import { getRecurringEvents } from "../../../src/resolvers/Query/getRecurringEvents";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { Event } from "../../../src/models";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import { Types } from "mongoose";
import {
  createTestUser,
  createTestUserAndOrganization,
  type TestOrganizationType,
  type TestUserType,
} from "../../helpers/userAndOrg";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;
let testAdminUser: TestUserType;
let testOrganization: TestOrganizationType;

beforeAll(async () => {
  const temp = await createTestUserAndOrganization();
  testUser = temp[0];
  testOrganization = temp[1];
  MONGOOSE_INSTANCE = await connect();
  testAdminUser = await createTestUser();
});
afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Query -> getRecurringEvents", () => {
  it("returns list of recurring events for a given baseRecurringEventId", async () => {
    const baseRecurringEventId = new Types.ObjectId();

    const testEvents = [
      {
        title: "Event 1",
        description: "description",
        allDay: true,
        startDate: new Date().toUTCString(),
        recurring: true,
        isPublic: true,
        isRegisterable: true,
        creator: testUser._id,
        admins: [testAdminUser._id],
        registrants: [],
        organization: testOrganization._id,
        baseRecurringEventId,
      },
      {
        title: "Event 2",
        description: "description",
        allDay: true,
        startDate: new Date(),
        recurring: true,
        isPublic: true,
        isRegisterable: true,
        creator: testUser._id,
        admins: [testAdminUser._id],
        registrants: [],
        organization: testOrganization._id,
        baseRecurringEventId,
      },
    ];

    await Event.insertMany(testEvents);

    const args = { baseRecurringEventId: baseRecurringEventId.toString() };
    const result = await getRecurringEvents({}, args, {} as unknown);

    expect(result).toHaveLength(2);
    expect(result[0].title).toBe("Event 1");
    expect(result[1].title).toBe("Event 2");

    await Event.deleteMany({ baseRecurringEventId });
  });

  it("returns an empty array when no recurring events are found", async () => {
    const nonExistentId = new Types.ObjectId();
    const args = { baseRecurringEventId: nonExistentId.toString() };
    const result = await getRecurringEvents({}, args, {} as unknown);

    expect(result).toEqual([]);
  });

  it("throws an error when there's a problem fetching events", async () => {
    const mockFind = vi.spyOn(Event, "find").mockImplementation(() => {
      throw new Error("Database error");
    });

    const args = { baseRecurringEventId: new Types.ObjectId().toString() };

    await expect(getRecurringEvents({}, args, {} as unknown)).rejects.toThrow(
      "Database error"
    );

    mockFind.mockRestore();
  });
});
