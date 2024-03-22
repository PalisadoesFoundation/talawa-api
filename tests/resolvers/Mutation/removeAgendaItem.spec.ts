import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  AGENDA_ITEM_NOT_FOUND_ERROR,
  UNAUTHORIZED_REMOVE_AGENDA_ITEM_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import {
  AgendaItemModel,
  AppUserProfile,
  Organization,
  User,
} from "../../../src/models";
import { removeAgendaItem } from "../../../src/resolvers/Mutation/removeAgendaItem";
import type { MutationRemoveAgendaItemArgs } from "../../../src/types/generatedGraphQLTypes";
import type { TestAgendaItemType } from "../../helpers/agendaItem";
import { connect, disconnect } from "../../helpers/db";
import { createTestEvent } from "../../helpers/events";
import type { TestEventType } from "../../helpers/eventsWithRegistrants";
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";
import { createTestUser } from "../../helpers/userAndOrg";

let testUser: TestUserType;
let testAdminUser: TestUserType;
let MONGOOSE_INSTANCE: typeof mongoose;
let testEvent: TestEventType;
let testOrganization: TestOrganizationType;
let testAgendaItem: TestAgendaItemType;
let testAgendaItem2: TestAgendaItemType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  testUser = await createTestUser();
  testAdminUser = await createTestUser();
  testOrganization = await Organization.create({
    name: "name",
    description: "description",
    isPublic: true,
    creator: testUser?._id,
    admins: [testAdminUser?._id],
    members: [testUser?._id, testAdminUser?._id],
    creatorId: testUser?._id,
  });
  const temp = await createTestEvent();
  testEvent = temp[2];
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
  testAgendaItem = await AgendaItemModel.create({
    createdBy: testAdminUser?._id,
    updatedAt: Date.now(),
    createdAt: Date.now(),
    title: "Test Item",
    duration: "One hour",
    relatedEvent: testEvent?._id,
    sequence: 1,
    itemType: "Regular",
    isNote: false,
  });
  testAgendaItem2 = await AgendaItemModel.create({
    createdBy: testAdminUser?._id,
    updatedAt: Date.now(),
    createdAt: Date.now(),
    title: "Test Item2",
    duration: "One hour",
    relatedEvent: testEvent?._id,
    sequence: 1,
    itemType: "Regular",
    isNote: false,
  });
  await User.updateOne(
    {
      _id: testAdminUser?._id,
    },
    {
      $push: {
        createdAgendaItems: [testAgendaItem, testAgendaItem2],
      },
    },
  );
  const { requestContext } = await import("../../../src/libraries");
  vi.spyOn(requestContext, "translate").mockImplementation(
    (message: unknown) => message,
  );
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> removeAgendaItem", () => {
  it("throws unknown error if no user exists with _id === userId", async () => {
    try {
      const args: MutationRemoveAgendaItemArgs = {
        id: testAgendaItem?._id,
      };

      const context = {
        userId: new Types.ObjectId().toString(),
      };

      if (removeAgendaItem) {
        await removeAgendaItem({}, args, context);
      } else {
        throw new Error("removeAgendaItem resolver is undefined");
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        expect(error.message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
      } else {
        throw new Error("An unknown error occurred.");
      }
    }
  });

  it("throws unknown error if no agenda item exists with _id === args.id", async () => {
    try {
      const args: MutationRemoveAgendaItemArgs = {
        id: new Types.ObjectId().toString(),
      };

      const context = {
        userId: testAdminUser?._id,
      };

      if (removeAgendaItem) {
        await removeAgendaItem({}, args, context);
      } else {
        throw new Error("removeAgendaItem resolver is undefined");
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        expect(error.message).toEqual(AGENDA_ITEM_NOT_FOUND_ERROR.MESSAGE);
      } else {
        throw new Error("An unknown error occurred.");
      }
    }
  });

  it("throws unknown error if user is not the creator of the agenda item", async () => {
    try {
      const args: MutationRemoveAgendaItemArgs = {
        id: testAgendaItem?._id,
      };

      const context = {
        userId: testUser?._id,
      };

      if (removeAgendaItem) {
        await removeAgendaItem({}, args, context);
      } else {
        throw new Error("removeAgendaItem resolver is undefined");
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        expect(error.message).toEqual(
          UNAUTHORIZED_REMOVE_AGENDA_ITEM_ERROR.MESSAGE,
        );
      } else {
        throw new Error("An unknown error occurred.");
      }
    }
  });

  it("removes the agenda item if user is the creator", async () => {
    const args: MutationRemoveAgendaItemArgs = {
      id: testAgendaItem?._id,
    };

    const context = {
      userId: testAdminUser?._id,
    };

    if (removeAgendaItem) {
      try {
        const result = await removeAgendaItem({}, args, context);
        expect(result._id.toString()).toEqual(testAgendaItem?._id.toString());

        // Check if the agenda item is removed from the database
        const deletedAgendaItem = await AgendaItemModel.findOne({
          _id: args.id,
        });
        expect(deletedAgendaItem).toBeNull();
      } catch (error: unknown) {
        if (error instanceof Error) {
          throw error;
        } else {
          throw new Error("An unknown error occurred.");
        }
      }
    } else {
      throw new Error("removeAgendaItem resolver is undefined");
    }
  });
  it("throws an error if the user does not have appUserProfile", async () => {
    await AppUserProfile.deleteOne({
      userId: testAdminUser?._id,
    });
    const args: MutationRemoveAgendaItemArgs = {
      id: testAgendaItem?._id,
    };
    const context = {
      userId: testAdminUser?._id,
    };

    try {
      if (removeAgendaItem) await removeAgendaItem({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        USER_NOT_AUTHORIZED_ERROR.MESSAGE,
      );
    }
  });
});
