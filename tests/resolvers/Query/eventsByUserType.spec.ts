// Write three tests for all user types
// Create User as Super admin and create a public and private event for an organization
// Super admin should have access
// Create a ADMIN user of an organization and admin should have access
// Create a User; add user to a private event as registrant, user should be able to see the event
// Create another private event under the same organization
// Normal user who is not a registrant shouldn't have access.

import "dotenv/config";
import { Event } from "../../../src/models";
import { connect, disconnect, dropCollection } from "../../helpers/db";
import type { QueryEventsByUserTypeArgs } from "../../../src/types/generatedGraphQLTypes";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type {
  TestUserType,
  TestOrganizationType,
} from "../../helpers/userAndOrg";
import {
  createTestUserAndOrganization,
  createTestUser,
} from "../../helpers/userAndOrg";

import { createEventWithRegistrant } from "../../helpers/events";
import type mongoose from "mongoose";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;
let testUser2: TestUserType;
let testUser3: TestUserType;
let testOrganization2: TestOrganizationType;
let testOrganization3: TestOrganizationType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  testUser = await createTestUser("SUPERADMIN");
  [testUser2, testOrganization2] = await createTestUserAndOrganization();
  [testUser3, testOrganization3] = await createTestUserAndOrganization(
    true,
    false,
    true,
    undefined
  );
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Query -> eventsByUserType", () => {
  describe("resolvers -> Query -> events -> SUPERADMIN", () => {
    beforeAll(async () => {
      await createEventWithRegistrant(
        testUser2?._id,
        testOrganization2?._id,
        true,
        "ONCE"
      );
      await createEventWithRegistrant(
        testUser2?._id,
        testOrganization2?._id,
        true,
        "ONCE",
        undefined,
        false
      );
    });

    afterAll(async () => {
      await dropCollection(MONGOOSE_INSTANCE, "events");
    });

    it(`returns list of existing public and private events sorted by ascending order of event._id for SUPERADMIN
          if args.orderBy === 'id_ASC'`, async () => {
      const sort = {
        _id: 1,
      };

      const args: QueryEventsByUserTypeArgs = {
        orgId: testOrganization2?._id,
        userId: testUser?._id,
        orderBy: "id_ASC",
      };
      const { eventsByUserType } = await import(
        "../../../src/resolvers/Query/eventsByUserType"
      );
      const eventsByUserTypePayload = await eventsByUserType?.({}, args, {});

      const eventsByUserTypeInfo = await Event.find({
        organization: testOrganization2?._id,
        status: "ACTIVE",
      })
        .sort(sort)
        .populate("creator", "-password")
        .populate("tasks")
        .populate("admins", "-password")
        .lean();

      expect(eventsByUserTypePayload).toEqual(eventsByUserTypeInfo);
    });
  });

  describe("resolvers -> Query -> events -> ADMIN", () => {
    beforeAll(async () => {
      await createEventWithRegistrant(
        testUser2?._id,
        testOrganization2?._id,
        true,
        "ONCE"
      );
      await createEventWithRegistrant(
        testUser2?._id,
        testOrganization2?._id,
        true,
        "ONCE",
        testUser3?._id,
        false
      );
      await createEventWithRegistrant(
        testUser?._id,
        testOrganization3?._id,
        true,
        "ONCE"
      );
    });

    afterAll(async () => {
      await dropCollection(MONGOOSE_INSTANCE, "events");
    });

    it(`returns list of existing public and private events sorted by ascending order of event._id for Organization ADMIN
          if args.orderBy === 'id_ASC'`, async () => {
      const args: QueryEventsByUserTypeArgs = {
        orderBy: "id_ASC",
        orgId: testOrganization2?._id,
        userId: testUser2?._id,
      };
      const { eventsByUserType } = await import(
        "../../../src/resolvers/Query/eventsByUserType"
      );
      const eventsByUserTypePayload = await eventsByUserType?.({}, args, {});

      expect(eventsByUserTypePayload).toHaveLength(2);
    });

    it(`does not return list of another organization's existing events sorted by ascending order of event._id for organization's ADMIN
    if args.orderBy === 'id_ASC'`, async () => {
      const args: QueryEventsByUserTypeArgs = {
        orgId: testOrganization2?._id,
        userId: testUser2?._id,
        orderBy: "id_ASC",
      };
      const { eventsByUserType } = await import(
        "../../../src/resolvers/Query/eventsByUserType"
      );
      const eventsByUserTypePayload = await eventsByUserType?.({}, args, {});

      expect(eventsByUserTypePayload).toHaveLength(2);
    });
  });

  describe("resolvers -> Query -> events -> USER", () => {
    beforeAll(async () => {
      await createEventWithRegistrant(
        testUser?._id,
        testOrganization3?._id,
        true,
        "ONCE"
      );
      await createEventWithRegistrant(
        testUser?._id,
        testOrganization3?._id,
        true,
        "ONCE",
        testUser3?._id,
        false
      );
      await createEventWithRegistrant(
        testUser?._id,
        testOrganization3?._id,
        true,
        "ONCE",
        undefined,
        false
      );
    });

    afterAll(async () => {
      await dropCollection(MONGOOSE_INSTANCE, "events");
    });

    it(`returns list of existing public events sorted by ascending order of event._id for Organization User
          if args.orderBy === 'id_ASC'`, async () => {
      const args: QueryEventsByUserTypeArgs = {
        orgId: testOrganization3?._id,
        userId: testUser3?._id,
        orderBy: "id_ASC",
      };
      const { eventsByUserType } = await import(
        "../../../src/resolvers/Query/eventsByUserType"
      );
      const eventsByUserTypePayload = await eventsByUserType?.({}, args, {});

      expect(eventsByUserTypePayload).toHaveLength(2);
    });
  });
});
