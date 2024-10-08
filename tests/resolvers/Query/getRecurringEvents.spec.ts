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
  MONGOOSE_INSTANCE = await connect();
  const result = await createTestUserAndOrganization();
  testUser = result[0];
  testOrganization = result[1];
  testAdminUser = await createTestUser();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Query -> getRecurringEvents", () => {
  it("returns list of recurring events for a given baseRecurringEventId", async () => {
    if (!testUser || !testAdminUser || !testOrganization) {
      throw new Error("Test setup failed");
    }
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
        creatorId: testUser._id,
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
        creatorId: testUser._id,
        admins: [testAdminUser._id],
        registrants: [],
        organization: testOrganization._id,
        baseRecurringEventId,
      },
    ];

    await Event.insertMany(testEvents);

    const args = { baseRecurringEventId: baseRecurringEventId.toString() };
    const getRecurringEventsFunction = getRecurringEvents as unknown as (
      parent: any,
      args: any,
      context: any,
    ) => Promise<any[]>;
    const result = await getRecurringEventsFunction({}, args, {});

    expect(result).toHaveLength(2);
    expect(result[0].title).toBe("Event 1");
    expect(result[1].title).toBe("Event 2");

    await Event.deleteMany({ baseRecurringEventId });
  });

  it("returns an empty array when no recurring events are found", async () => {
    const nonExistentId = new Types.ObjectId();
    const args = { baseRecurringEventId: nonExistentId.toString() };
    const getRecurringEventsFunction = getRecurringEvents as unknown as (
      parent: any,
      args: any,
      context: any,
    ) => Promise<any[]>;
    const result = await getRecurringEventsFunction({}, args, {});

    expect(result).toEqual([]);
  });

  it("throws an error when there's a problem fetching events", async () => {
    const mockFind = vi.spyOn(Event, "find").mockImplementation(() => {
      throw new Error("Database error");
    });

    const args = { baseRecurringEventId: new Types.ObjectId().toString() };
    const getRecurringEventsFunction = getRecurringEvents as unknown as (
      parent: any,
      args: any,
      context: any,
    ) => Promise<any[]>;

    await expect(getRecurringEventsFunction({}, args, {})).rejects.toThrow(
      "Database error",
    );

    mockFind.mockRestore();
  });
});
