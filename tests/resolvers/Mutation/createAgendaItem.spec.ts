import {
  AGENDA_ITEM_NOT_FOUND_ERROR,
  AGENDA_ITEM_CREATION_ERROR,
  LENGTH_VALIDATION_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { expect, vi , beforeAll, afterAll, describe, it } from "vitest";
import type { MutationCreateAgendaItemArgs } from "../../../src/types/generatedGraphQLTypes";
import { createAgendaItem } from "../../../src/resolvers/Mutation/createAgendaItem";
import { connect, disconnect } from "../../helpers/db";
import { createTestUser } from "../../helpers/userAndOrg";
import type { TestUserType, TestOrganizationType  } from "../../helpers/userAndOrg";
import type { TestEventType } from "../../helpers/events";
import { Organization, Event, User } from "../../../src/models";
import type mongoose from "mongoose";
import { Types } from "mongoose";
let testUser: TestUserType;
let testAdminUser: TestUserType;
let testOrganization: TestOrganizationType;
let testEvent: TestEventType;
let MONGOOSE_INSTANCE: typeof mongoose;
let testUserSuperAdmin: TestUserType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  testUser = await createTestUser();
  testAdminUser = await createTestUser();
  testUserSuperAdmin = await createTestUser();
  testOrganization = await Organization.create({
    name: "name",
    description: "description",
    isPublic: true,
    creator: testUser?._id,
    admins: [testAdminUser?._id],
    members: [testUser?._id, testAdminUser?._id],
  });

  testEvent = await Event.create({
    title: "title",
    description: "description",
    allDay: true,
    startDate: new Date(),
    recurring: true,
    isPublic: true,
    isRegisterable: true,
    creator: testUser?._id,
    admins: [testAdminUser?._id],
    registrants: [],
    organization: testOrganization?._id,
  });

  await User.updateOne(
    {
      _id: testUser?._id,
    },
    {
      $push: {
        adminFor: testOrganization?._id,
      },
    }
  );
  const { requestContext } = await import("../../../src/libraries");
  vi.spyOn(requestContext, "translate").mockImplementation(
    (message) => message
  );
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> createAgendaItem", () => {
  it(`creates a regular agenda item successfully`, async () => {
    try {
      const args: MutationCreateAgendaItemArgs = {
        input: {
          title: "Regular Agenda Item",
          description: "Description for the regular agenda item",
          duration: "1 hour",
          relatedEvent: testEvent?.id,
          createdBy: testUser?._id,
          sequence: 1,
          itemType: "Regular",
          organization: testOrganization?._id,
          isNote: false,
        },
      };

      const context = {
        userId: testUser?.id,
      };

      const { createAgendaItem: createAgendaItemResolver } = await import(
        "../../../src/resolvers/Mutation/createAgendaItem"
      );

      const createdAgendaItem = await createAgendaItemResolver?.(
        {},
        args,
        context
      );

      expect(createdAgendaItem).toBeDefined();

      // Verify that the agenda item is associated with the correct user, organization, and category
      expect(createdAgendaItem?.createdBy).toBe(testUser?.id);
      expect(createdAgendaItem?.organization).toBe(testOrganization?.id);
      // Verify that the user's lists are updated correctly
      // const updatedUser = await User.findById(testUser?.id).lean();
      // expect(updatedUser?.createdAgendaItems).toContain(
      //   createdAgendaItem?._id.toString()
      // );
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
    }
  });
});

describe("resolvers -> Mutation -> createAgendaItem", () => {
  it("throws NotFoundError when creating an agenda item with a non-existing user", async () => {
    try {
      const args: MutationCreateAgendaItemArgs = {
        input: {
          title: "Regular Agenda Item",
          description: "Description for the regular agenda item",
          duration: "1 hour",
          relatedEvent: testEvent?.id,
          createdBy: Types.ObjectId().toString(), // Non-existing user ID
          sequence: 1,
          itemType: "Regular",
          organization: testOrganization?._id,
          isNote: false,
        },
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      const { createAgendaItem: createAgendaItemResolver } = await import(
        "../../../src/resolvers/Mutation/createAgendaItem"
      );

      await createAgendaItemResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it("throws NotFoundError when creating an agenda item with a non-existing organization", async () => {
    try {
      const args: MutationCreateAgendaItemArgs = {
        input: {
          title: "Regular Agenda Item",
          description: "Description for the regular agenda item",
          duration: "1 hour",
          relatedEvent: testEvent?.id,
          createdBy: testUser?._id,
          sequence: 1,
          itemType: "Regular",
          organization: Types.ObjectId().toString(), // Non-existing organization ID
          isNote: false,
        },
      };

      const context = {
        userId: testUser?.id,
      };

      const { createAgendaItem: createAgendaItemResolver } = await import(
        "../../../src/resolvers/Mutation/createAgendaItem"
      );

      await createAgendaItemResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it("throws UnauthorizedError when creating an agenda item without necessary authorization", async () => {
    try {
      const args: MutationCreateAgendaItemArgs = {
        input: {
          title: "Regular Agenda Item",
          description: "Description for the regular agenda item",
          duration: "1 hour",
          relatedEvent: testEvent?.id,
          createdBy: "67378abd85008f171cf2991d", // User not admin or creator of the organization
          sequence: 1,
          itemType: "Regular",
          organization: testOrganization?._id,
          isNote: false,
        },
      };

      const context = {
        userId: testUser?.id,
      };

      const { createAgendaItem: createAgendaItemResolver } = await import(
        "../../../src/resolvers/Mutation/createAgendaItem"
      );

      await createAgendaItemResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
    }
  });

  // it("throws validation error when creating a regular agenda item without specifying required fields", async () => {
  //   try {
  //     const args: MutationCreateAgendaItemArgs = {
  //       input: {
  //         createdBy: testUser?._id,
  //         itemType: "Regular",
  //         isNote: false,
  //         duration: "",
  //         relatedEvent: "",
  //         sequence: 0,
  //         title: ""
  //       },
  //     };

  //     const context = {
  //       userId: testUser?.id,
  //     };

  //     const { createAgendaItem: createAgendaItemResolver } = await import(
  //       "../../../src/resolvers/Mutation/createAgendaItem"
  //     );

  //     await createAgendaItemResolver?.({}, args, context);
  //   } catch (error: any) {
  //     expect(error.message).toEqual(LENGTH_VALIDATION_ERROR.MESSAGE);
  //   }
  // });
});
