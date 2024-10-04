import "dotenv/config";
import { getRecurringEvents } from "../../../src/resolvers/Query/getRecurringEvents";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { Event } from "../../../src/models";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import { Types } from "mongoose";

let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Query -> getRecurringEvents", () => {
  it("returns list of recurring events for a given baseRecurringEventId", async () => {
    const baseRecurringEventId = new Types.ObjectId();
    const organizationId = new Types.ObjectId();
    const creatorId = new Types.ObjectId();

    const testEvents = [
      {
        title: "Event 1",
        description: "Description 1",
        allDay: false,
        startDate: new Date(),
        startTime: new Date(),
        endTime: new Date(),
        isPublic: true,
        isRegisterable: true,
        organization: organizationId,
        creatorId: creatorId,
        baseRecurringEventId,
      },
      {
        title: "Event 2",
        description: "Description 2",
        allDay: false,
        startDate: new Date(),
        startTime: new Date(),
        endTime: new Date(),
        isPublic: true,
        isRegisterable: true,
        organization: organizationId,
        creatorId: creatorId,
        baseRecurringEventId,
      },
      {
        title: "Event 3",
        description: "Description 3",
        allDay: false,
        startDate: new Date(),
        startTime: new Date(),
        endTime: new Date(),
        isPublic: true,
        isRegisterable: true,
        organization: organizationId,
        creatorId: creatorId,
        baseRecurringEventId: new Types.ObjectId(),
      },
    ];

    await Event.insertMany(testEvents);

    const args = { baseRecurringEventId: baseRecurringEventId.toString() };
    const result = await getRecurringEvents({}, args, {} as any);

    expect(result).toHaveLength(2);
    expect(result[0].title).toBe("Event 1");
    expect(result[1].title).toBe("Event 2");

    // Clean up
    await Event.deleteMany({ _id: { $in: result.map((e) => e._id) } });
  });

  it("returns an empty array when no recurring events are found", async () => {
    const nonExistentId = new Types.ObjectId();
    const args = { baseRecurringEventId: nonExistentId.toString() };
    const result = await getRecurringEvents({}, args, {} as any);

    expect(result).toEqual([]);
  });

  it("throws an error when there's a problem fetching events", async () => {
    const mockFind = vi.spyOn(Event, "find").mockImplementation(() => {
      throw new Error("Database error");
    });

    const args = { baseRecurringEventId: new Types.ObjectId().toString() };

    await expect(getRecurringEvents({}, args, {} as any)).rejects.toThrow(
      "Database error",
    );

    mockFind.mockRestore();
  });
});
