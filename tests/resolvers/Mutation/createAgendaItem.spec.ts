import {
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
  EVENT_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { expect, vi, beforeAll, afterAll, describe, it } from "vitest";
import type { MutationCreateAgendaItemArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import { createTestUser } from "../../helpers/userAndOrg";
import type {
  TestUserType,
  TestOrganizationType,
} from "../../helpers/userAndOrg";
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
let testRandomUser: TestUserType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  testUser = await createTestUser();
  testAdminUser = await createTestUser();
  testUserSuperAdmin = await createTestUser();
  testRandomUser = await createTestUser();
  testOrganization = await Organization.create({
    name: "name",
    description: "description",
    isPublic: true,
    creator: testUser?._id,
    admins: [testAdminUser?._id, testUser?._id], // Fixed the syntax here
    members: [testUser?._id, testAdminUser?._id],
    creatorId: testUser?._id,
  });

  testUserSuperAdmin = await User.findOneAndUpdate(
    {
      _id: testUserSuperAdmin?._id,
    },
    {
      userType: "SUPERADMIN",
    },
    {
      new: true,
    },
  );

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
    creatorId: testUser?._id,
  });

  await User.updateOne(
    {
      _id: testUser?._id,
    },
    {
      $push: {
        adminFor: testOrganization?._id,
      },
    },
  );

  const { requestContext } = await import("../../../src/libraries");
  vi.spyOn(requestContext, "translate").mockImplementation(
    (message) => message,
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
          relatedEventId: testEvent?._id,
          sequence: 1,
          itemType: "Regular",
          organizationId: testOrganization?._id,
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
        context,
      );

      // // Optionally, you can check that the returned item does not contain Mongoose-specific properties
      expect(createdAgendaItem?._id).toBeDefined();
    } catch (error) {
      if (error instanceof Error) {
        expect(error.message).toEqual(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
      } else {
        throw new Error("An unknown error occurred.");
      }
    }
  });

  it("throws NotFoundError when creating an agenda item with a non-existing user", async () => {
    try {
      const args: MutationCreateAgendaItemArgs = {
        input: {
          title: "Regular Agenda Item",
          description: "Description for the regular agenda item",
          duration: "1 hour",
          relatedEventId: testEvent?._id,
          sequence: 1,
          itemType: "Regular",
          organizationId: testOrganization?._id, // A random ID that does not exist in the database,
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
    } catch (error) {
      if (error instanceof Error) {
        expect(error.message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
      } else {
        throw new Error("An unknown error occurred.");
      }
    }
  });

  it("throws NotFoundError when creating an agenda item with a non-existing organization", async () => {
    try {
      const args: MutationCreateAgendaItemArgs = {
        input: {
          title: "Regular Agenda Item",
          description: "Description for the regular agenda item",
          duration: "1 hour",
          relatedEventId: testEvent?._id,
          sequence: 1,
          itemType: "Regular",
          organizationId: Types.ObjectId().toString(), // A random ID that does not exist in the database
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
    } catch (error) {
      if (error instanceof Error) {
        expect(error.message).toEqual(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE);
      } else {
        throw new Error("An unknown error occurred.");
      }
    }
  });

  it("throws NotFoundError when creating an agenda item with a non-existing event", async () => {
    try {
      const args: MutationCreateAgendaItemArgs = {
        input: {
          title: "Regular Agenda Item",
          description: "Description for the regular agenda item",
          duration: "1 hour",
          relatedEventId: Types.ObjectId().toString(),
          sequence: 1,
          itemType: "Regular",
          organizationId: testOrganization?._id,
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
    } catch (error) {
      if (error instanceof Error) {
        expect(error.message).toEqual(EVENT_NOT_FOUND_ERROR.MESSAGE);
      } else {
        throw new Error("An unknown error occurred.");
      }
    }
  });

  it("throws UnauthorizedError when creating an agenda item without necessary authorization", async () => {
    try {
      const args: MutationCreateAgendaItemArgs = {
        input: {
          title: "Regular Agenda Item",
          description: "Description for the regular agenda item",
          duration: "1 hour",
          relatedEventId: testEvent?._id,
          sequence: 1,
          itemType: "Regular",
          organizationId: testOrganization?._id,
          isNote: false,
        },
      };

      const context = {
        userId: testRandomUser?._id,
      };

      const { createAgendaItem: createAgendaItemResolver } = await import(
        "../../../src/resolvers/Mutation/createAgendaItem"
      );

      await createAgendaItemResolver?.({}, args, context);
    } catch (error) {
      if (error instanceof Error) {
        expect(error.message).toEqual(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
      } else {
        throw new Error("An unknown error occurred.");
      }
    }
  });

  it(`creates the actionItem when user is authorized as an eventAdmin`, async () => {
    const args: MutationCreateAgendaItemArgs = {
      input: {
        title: "Regular Agenda Item",
        description: "Description for the regular agenda item",
        duration: "1 hour",
        relatedEventId: testEvent?._id,
        sequence: 1,
        itemType: "Regular",
        organizationId: testOrganization?._id,
        isNote: false,
      },
    };
    const context = {
      userId: testAdminUser?._id,
    };
    const { createAgendaItem: createAgendaItemResolver } = await import(
      "../../../src/resolvers/Mutation/createAgendaItem"
    );
    const createdAgendaItem = await createAgendaItemResolver?.(
      {},
      args,
      context,
    );
    expect(createdAgendaItem).toBeDefined();
  });

  it(`creates the actionItem when user is authorized as an orgAdmin`, async () => {
    const args: MutationCreateAgendaItemArgs = {
      input: {
        title: "Regular Agenda Item",
        description: "Description for the regular agenda item",
        duration: "1 hour",
        relatedEventId: testEvent?._id,
        sequence: 1,
        itemType: "Regular",
        organizationId: testOrganization?._id,
        isNote: false,
      },
    };
    const context = {
      userId: testAdminUser?._id,
    };
    const { createAgendaItem: createAgendaItemResolver } = await import(
      "../../../src/resolvers/Mutation/createAgendaItem"
    );
    const createdAgendaItem = await createAgendaItemResolver?.(
      {},
      args,
      context,
    );
    expect(createdAgendaItem).toBeDefined();
  });
});
