/* eslint-disable @typescript-eslint/no-non-null-assertion */
import "dotenv/config";
import { GraphQLError } from "graphql";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  type InterfaceOrganization,
  Event,
  Organization,
  User,
} from "../../../src/models";
import {
  events as eventsResolver,
  parseCursor,
} from "../../../src/resolvers/Organization/events";
import type { DefaultGraphQLArgumentError } from "../../../src/utilities/graphQLConnection";
import { connect, disconnect } from "../../helpers/db";
import type { TestEventType } from "../../helpers/events";
import { nanoid } from "nanoid";

let MONGOOSE_INSTANCE: typeof mongoose;
let testEvent1: TestEventType,
  testEvent2: TestEventType,
  testOrganization: InterfaceOrganization;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();

  const testUser = await User.create({
    email: `email${nanoid()}@email.com`,
    firstName: "firstName",
    lastName: "lastName",
    password: "passwordHash",
  });

  testOrganization = await Organization.create({
    creatorId: testUser._id,
    description: "description",
    name: "name",
  });

  const testEvents = await Event.insertMany([
    {
      allDay: true,
      creatorId: testUser._id,
      description: "description",
      isPublic: true,
      isRegisterable: true,
      organization: testOrganization._id,
      startDate: new Date(),
      title: "title",
    },
    {
      allDay: true,
      creatorId: testUser._id,
      description: "description",
      isPublic: true,
      isRegisterable: true,
      organization: testOrganization._id,
      startDate: new Date(),
      title: "title",
    },
  ]);
  testEvent1 = testEvents[0].toObject();
  testEvent2 = testEvents[1].toObject();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("events resolver", () => {
  const parent = testOrganization;
  it(`throws GraphQLError if invalid arguments are provided to the resolver`, async () => {
    try {
      await eventsResolver?.(parent, {}, {});
    } catch (error) {
      if (error instanceof GraphQLError) {
        expect(error.extensions.code).toEqual("INVALID_ARGUMENTS");
        expect(
          (error.extensions.errors as DefaultGraphQLArgumentError[]).length
        ).toBeGreaterThan(0);
      }
    }
  });

  it(`returns the expected connection object`, async () => {
    const parent = testOrganization;
    const connection = await eventsResolver?.(
      parent,
      {
        first: 2,
      },
      {}
    );

    const totalCount = await Event.find({
      organization: testOrganization?._id,
    }).countDocuments();

    expect(connection).toEqual({
      edges: [
        {
          cursor: testEvent2?._id.toString(),
          node: {
            ...testEvent2,
            _id: testEvent2?._id.toString(),
          },
        },
        {
          cursor: testEvent1?._id.toString(),
          node: {
            ...testEvent1,
            _id: testEvent1?._id.toString(),
          },
        },
      ],
      pageInfo: {
        endCursor: testEvent1?._id.toString(),
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: testEvent2?._id.toString(),
      },
      totalCount,
    });
  });
});

describe("parseCursor function", () => {
  it("returns failure state if argument cursorValue is an invalid cursor", async () => {
    const result = await parseCursor({
      cursorName: "after",
      cursorPath: ["after"],
      cursorValue: new Types.ObjectId().toString(),
      organizationId: testOrganization?._id.toString() as string,
    });

    expect(result.isSuccessful).toEqual(false);
    if (result.isSuccessful === false) {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });

  it("returns success state if argument cursorValue is a valid cursor", async () => {
    const result = await parseCursor({
      cursorName: "after",
      cursorPath: ["after"],
      cursorValue: testEvent1?._id.toString() as string,
      organizationId: testOrganization?._id.toString() as string,
    });

    expect(result.isSuccessful).toEqual(true);
    if (result.isSuccessful === true) {
      expect(result.parsedCursor).toEqual(testEvent1?._id.toString());
    }
  });
});