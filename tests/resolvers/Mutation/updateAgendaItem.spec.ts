import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { User, AgendaItemModel, Organization } from "../../../src/models";
import type { MutationUpdateAgendaItemArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import { updateAgendaItem } from "../../../src/resolvers/Mutation/updateAgendaItem";
import {
  USER_NOT_FOUND_ERROR,
  AGENDA_ITEM_NOT_FOUND_ERROR,
  UNAUTHORIZED_UPDATE_AGENDA_ITEM_ERROR,
} from "../../../src/constants";
import { removeAgendaItem } from "../../../src/resolvers/Mutation/removeAgendaItem";
import { createTestUser } from "../../helpers/userAndOrg";

let testUser: TestUserType;
let testAdminUser: TestUserType;
let MONGOOSE_INSTANCE: typeof mongoose;
let testEvent: TestEventType;
let testOrganization: TestOrganizationType;
let testUser2: TestUserType;
let testAgendaItem: any;
let testAgendaItem2: any;

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
  testUser2 = await createTestUser();
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

describe("resolvers -> Mutation -> updateAgendaItem", () => {
  it("throws NotFoundError if no user exists with _id === userID", async () => {
    try {
      const args: MutationUpdateAgendaItemArgs = {
        id: "",
        input: {
          updatedBy: Types.ObjectId().toString(),
        },
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };
      await updateAgendaItem?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it("throws NotFoundError if no agenda item exists with _id === args.id", async () => {
    try {
      const args: MutationUpdateAgendaItemArgs = {
        id: Types.ObjectId().toString(),
        input: {
          updatedBy: testAdminUser?._id,
        },
      };

      const context = {
        userId: testAdminUser?._id,
      };
      await updateAgendaItem?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(AGENDA_ITEM_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it("throws UnauthorizedError if user is not the creator of the agenda item", async () => {
    try {
      const args: MutationUpdateAgendaItemArgs = {
        id: testAgendaItem._id.toString(),
        input: {
          updatedBy: testUser?._id,
        },
      };

      const context = {
        userId: testUser?._id,
      };
      await updateAgendaItem?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(
        UNAUTHORIZED_UPDATE_AGENDA_ITEM_ERROR.MESSAGE
      );
    }
  });

  it("updates the agenda item successfully", async () => {
    const updatedAgendaItem = await AgendaItemModel.findOneAndUpdate(
      {
        _id: testAgendaItem?._id,
      },
      {
        $push: {
          createdBy: testAdminUser?._id,
        },
      },
      {
        new: true,
      }
    ).lean();

    await User.updateOne(
      {
        _id: testAdminUser?._id,
      },
      {
        $push: {
          updatedAgendaItem: [testAgendaItem],
        },
      }
    );

    const args: MutationUpdateAgendaItemArgs = {
      id: testAgendaItem._id.toString(),
      input: {
        updatedBy: testAdminUser?._id,
        title: "Test Item New",
        duration: "One hour plus extra time ",
        relatedEvent: testEvent?._id,
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
      context
    );

    const testUpdateAgendaItemPayload = await AgendaItemModel.findOne({
      _id: testAgendaItem?._id,
    }).lean();

    expect(updateAgendaItemPayload).toEqual(testUpdateAgendaItemPayload);
  });
});
