import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { User, Event } from "../../../src/models";
import type { InterfaceEvent } from "../../../src/models/Event";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type { InterfaceUser } from "../../../src/models/User";
import { connect, disconnect } from "../../helpers/db";
import { eventsAttendedByUser } from "../../../src/resolvers/Query/eventsAttendedByUser";

let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Query -> eventAttendedByUser", () => {
  let testUser: InterfaceUser;
  let testEvents: InterfaceEvent[];

  beforeAll(async () => {
    testUser = await User.create({
      firstName: "Test",
      lastName: "User",
      email: "testuser@example.com",
      password: "pass@123",
    });

    const eventData: Partial<InterfaceEvent>[] = [
      {
        title: "Test Event 1",
        description: "Test Description 1",
        attendees: testUser._id.toString(),
        isRegisterable: true,
        isPublic: true,
        creatorId: testUser._id,
      },
      {
        title: "Test Event 2",
        description: "Test Description 2",
        attendees: "",
        isRegisterable: true,
        isPublic: true,
        creatorId: testUser._id,
      },
    ];

    testEvents = await Event.create(eventData);
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Event.deleteMany({});
  });

  it("returns true if user has attended the event", async () => {
    const args = {
      userId: testUser._id.toString(),
      eventId: testEvents[0]._id.toString(),
    };
    const result = await eventsAttendedByUser({}, args, {} as unknown);
    expect(result).toBe(true);
  });

  it("returns false if user has not attended the event", async () => {
    const args = {
      userId: testUser._id.toString(),
      eventId: testEvents[1]._id.toString(),
    };
    const result = await eventsAttendedByUser({}, args, {} as unknown);
    expect(result).toBe(false);
  });

  it("returns false if user does not exist", async () => {
    const args = {
      userId: new Types.ObjectId().toString(),
      eventId: testEvents[0]._id.toString(),
    };
    const result = await eventsAttendedByUser({}, args, {} as unknown);
    expect(result).toBe(false);
  });

  it("returns false if event does not exist", async () => {
    const args = {
      userId: testUser._id.toString(),
      eventId: new Types.ObjectId().toString(),
    };
    const result = await eventsAttendedByUser({}, args, {} as unknown);
    expect(result).toBe(false);
  });
});
