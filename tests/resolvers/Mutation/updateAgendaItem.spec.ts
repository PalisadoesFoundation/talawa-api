import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  AGENDA_ITEM_NOT_FOUND_ERROR,
  UNAUTHORIZED_UPDATE_AGENDA_ITEM_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import {
  AgendaItemModel,
  AppUserProfile,
  Organization,
  User,
} from "../../../src/models";
import { updateAgendaItem } from "../../../src/resolvers/Mutation/updateAgendaItem";
import type { MutationUpdateAgendaItemArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import { createTestUser } from "../../helpers/userAndOrg";

let testUser: TestUserType;
let testAdminUser: TestUserType;
let MONGOOSE_INSTANCE: typeof mongoose;
let testEvent: TestEventType;
let testOrganization: TestOrganizationType;
let testAgendaItem: TestAgendaItemType;
let testAgendaItem2: TestAgendaItemType;

import type { TestAgendaItemType } from "../../helpers/agendaItem";
import { createTestEvent } from "../../helpers/events";
import type { TestEventType } from "../../helpers/eventsWithRegistrants";
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  testUser = await createTestUser();
  testAdminUser = await createTestUser();
  testOrganization = await Organization.create({
    name: "name",
    description: "description",
    isPublic: true,
    creator: testUser?._id,
    creatorId: testUser?._id,
    admins: [testAdminUser?._id],
    members: [testUser?._id, testAdminUser?._id],
  });
  const temp = await createTestEvent();
  testEvent = temp[2];
  await AppUserProfile.updateOne(
    {
      userId: testUser?._id,
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

describe("resolvers -> Mutation -> updateAgendaItem", () => {
  it("throws NotFoundError if no user exists with _id === userID", async () => {
    try {
      const args: MutationUpdateAgendaItemArgs = {
        id: "",
        input: {
          title: "Test Item New",
        },
      };

      const context = {
        userId: new Types.ObjectId().toString(),
      };
      await updateAgendaItem?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it("throws NotFoundError if no agenda item exists with _id === args.id", async () => {
    try {
      const args: MutationUpdateAgendaItemArgs = {
        id: new Types.ObjectId().toString(),
        input: {
          title: "Test Item New",
        },
      };

      const context = {
        userId: testAdminUser?._id,
      };
      await updateAgendaItem?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        AGENDA_ITEM_NOT_FOUND_ERROR.MESSAGE,
      );
    }
  });

  it("throws UnauthorizedError if user is not the creator of the agenda item", async () => {
    try {
      const args: MutationUpdateAgendaItemArgs = {
        id: testAgendaItem._id.toString(),
        input: {
          title: "Test Item New",
        },
      };

      const context = {
        userId: testUser?._id,
      };
      await updateAgendaItem?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        UNAUTHORIZED_UPDATE_AGENDA_ITEM_ERROR.MESSAGE,
      );
    }
  });

  it("updates the agenda item successfully", async () => {
    const args: MutationUpdateAgendaItemArgs = {
      id: testAgendaItem._id.toString(),
      input: {
        title: "Test Item New",
        duration: "One hour plus extra time ",
        relatedEvent: testEvent?._id.toString(),
        sequence: 2,
      },
    };

    const context = {
      userId: testAdminUser?._id,
    };
    const { updateAgendaItem: updateAgendaItemResolver } = await import(
      "../../../src/resolvers/Mutation/updateAgendaItem"
    );
    const updateAgendaItemPayload = await updateAgendaItemResolver?.(
      {},
      args,
      context,
    );

    const testUpdateAgendaItemPayload = await AgendaItemModel.findOne({
      _id: testAgendaItem?._id,
    }).lean();

    expect(updateAgendaItemPayload).toEqual(testUpdateAgendaItemPayload);
  });
  it("throws an error if the user does not have appUserProfile", async () => {
    await AppUserProfile.deleteOne({
      userId: testUser?._id,
    });
    const args: MutationUpdateAgendaItemArgs = {
      id: testAgendaItem?._id,
      input: {
        description: "Updated Description",
      },
    };

    const context = {
      userId: testUser?._id,
    };

    try {
      await updateAgendaItem?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        USER_NOT_AUTHORIZED_ERROR.MESSAGE,
      );
    }
  });
});
