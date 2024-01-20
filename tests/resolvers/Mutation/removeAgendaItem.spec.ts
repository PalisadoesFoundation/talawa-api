import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { User, AgendaItemModel, Organization } from "../../../src/models";
import type { MutationRemoveAgendaItemArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import { removeAgendaItem } from "../../../src/resolvers/Mutation/removeAgendaItem";
import {
  USER_NOT_FOUND_ERROR,
  AGENDA_ITEM_NOT_FOUND_ERROR,
  UNAUTHORIZED_REMOVE_AGENDA_ITEM_ERROR,
} from "../../../src/constants";
import { createTestUser } from "../../helpers/userAndOrg";

let testUser: TestUserType;
let testAdminUser: TestUserType;
let MONGOOSE_INSTANCE: typeof mongoose;
let testEvent: TestEventType;
let testOrganization: TestOrganizationType;
let testUserSuperAdmin: TestUserType;
import type {
  TestUserType,
  TestOrganizationType,
} from "../../helpers/userAndOrg";
import type { TestEventType } from "../../helpers/eventsWithRegistrants";
import { createTestEvent } from "../../helpers/events";

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
    }
  );
  const { requestContext } = await import("../../../src/libraries");
  vi.spyOn(requestContext, "translate").mockImplementation(
    (message: any) => message
  );
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> removeAgendaItem", () => {
  it("throws NotFoundError if no user exists with _id === userId", async () => {
    try {
      const args: MutationRemoveAgendaItemArgs = {
        id: Types.ObjectId().toString(),
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      if (removeAgendaItem) {
        await removeAgendaItem({}, args, context);
      } else {
        throw new Error("removeAgendaItem resolver is undefined");
      }
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it("throws NotFoundError if no agenda item exists with _id === args.id", async () => {
    try {
      const args: MutationRemoveAgendaItemArgs = {
        id: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser?._id,
      };

      if (removeAgendaItem) {
        await removeAgendaItem({}, args, context);
      } else {
        throw new Error("removeAgendaItem resolver is undefined");
      }
    } catch (error: any) {
      expect(error.message).toEqual(AGENDA_ITEM_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it("throws UnauthorizedError if user is not the creator of the agenda item", async () => {
    try {
      const agendaItem = await AgendaItemModel.create({
        createdBy: Types.ObjectId().toString(),
        updatedAt: Date.now(),
        createdAt: Date.now(),
        title: "",
        duration: "",
        relatedEvent: "",

        sequence: null,
        itemType: null,
        isNote: null,
      });

      const args: MutationRemoveAgendaItemArgs = {
        id: agendaItem._id.toString(),
      };

      const context = {
        userId: testUser?._id,
      };

      if (removeAgendaItem) {
        await removeAgendaItem({}, args, context);
      } else {
        throw new Error("removeAgendaItem resolver is undefined");
      }
    } catch (error: any) {
      expect(error.message).toEqual(
        UNAUTHORIZED_REMOVE_AGENDA_ITEM_ERROR.MESSAGE
      );
    }
  });

  it("removes the agenda item if user is the creator and updates user's createdAgendaItems list", async () => {
    const agendaItem = await AgendaItemModel.create({
      createdBy: testUser?._id,
    });

    const args: MutationRemoveAgendaItemArgs = {
      id: agendaItem._id.toString(),
    };

    const context = {
      userId: testUser?._id,
    };

    if (removeAgendaItem) {
      const result = await removeAgendaItem({}, args, context);
      expect(result).toEqual(agendaItem._id.toString());

      // Check if the agenda item is removed from the database
      const deletedAgendaItem = await AgendaItemModel.findOne({
        _id: args.id,
      });
      expect(deletedAgendaItem).toBeNull();

      // Check if the agenda item is removed from the user's createdAgendaItems list
      const updatedUser = await User.findOne({
        _id: testUser?._id,
      }).lean();
      expect(updatedUser?.createdAgendaItems).not.toContainEqual(
        agendaItem._id
      );
    } else {
      throw new Error("removeAgendaItem resolver is undefined");
    }
  });
});
