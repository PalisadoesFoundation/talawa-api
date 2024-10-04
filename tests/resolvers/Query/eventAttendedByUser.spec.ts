import "dotenv/config";
import { eventsAttendedByUser } from "../../../src/resolvers/Query/eventsAttendedByUser";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { Event, User } from "../../../src/models";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { Types } from "mongoose";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: any;
let testEvents: any[];

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();

  testUser = await User.create({
    firstName: "Test",
    lastName: "User",
    email: "testuser@example.com",
    password: "password123",
  });

  const organizationId = new Types.ObjectId();
  const creatorId = new Types.ObjectId();

  testEvents = await Event.create([
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
      registrants: [{ userId: testUser._id, status: "ACTIVE" }],
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
      registrants: [{ userId: testUser._id, status: "ACTIVE" }],
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
      registrants: [{ userId: testUser._id, status: "INACTIVE" }],
    },
  ]);
});

afterAll(async () => {
  await User.deleteMany({});
  await Event.deleteMany({});
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Query -> eventsAttendedByUser", () => {
  it("returns events attended by the user with ACTIVE status", async () => {
    const args = { id: testUser._id.toString() };
    const result = await eventsAttendedByUser({}, args, {} as any);

    expect(result).toHaveLength(2);
    expect(result[0].title).toBe("Event 1");
    expect(result[1].title).toBe("Event 2");
  });

  it("does not return events with INACTIVE status", async () => {
    const args = { id: testUser._id.toString() };
    const result = await eventsAttendedByUser({}, args, {} as any);

    const inactiveEvent = result.find((event) => event.title === "Event 3");
    expect(inactiveEvent).toBeUndefined();
  });

  it("returns an empty array when user has not attended any events", async () => {
    const newUser = await User.create({
      firstName: "New",
      lastName: "User",
      email: "newuser@example.com",
      password: "password123",
    });

    const args = { id: newUser._id.toString() };
    const result = await eventsAttendedByUser({}, args, {} as any);

    expect(result).toHaveLength(0);
  });

  it("sorts events based on the provided orderBy argument", async () => {
    const args = {
      id: testUser._id.toString(),
      orderBy: "title_DESC",
    };
    const result = await eventsAttendedByUser({}, args, {} as any);

    expect(result[0].title).toBe("Event 2");
    expect(result[1].title).toBe("Event 1");
  });
});
