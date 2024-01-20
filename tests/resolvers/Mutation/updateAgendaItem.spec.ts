import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { User, AgendaItemModel } from "../../../src/models";
import type { MutationUpdateAgendaItemArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import { updateAgendaItem } from "../../../src/resolvers/Mutation/updateAgendaItem";
import {
  USER_NOT_FOUND_ERROR,
  AGENDA_ITEM_NOT_FOUND_ERROR,
  UNAUTHORIZED_UPDATE_AGENDA_ITEM_ERROR,
} from "../../../src/constants";
import { createTestUser } from "../../helpers/userAndOrg";

let testUser: TestUserType;
let MONGOOSE_INSTANCE: typeof mongoose;
import type { TestUserType } from "../../helpers/userAndOrg";

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  testUser = await createTestUser();
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
        id: Types.ObjectId().toString(),
        input: {
          updatedBy: Types.ObjectId().toString(),
        },
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      if (updateAgendaItem) {
        await updateAgendaItem({}, args, context);
      } else {
        throw new Error("updateAgendaItem resolver is undefined");
      }
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it("throws NotFoundError if no agenda item exists with _id === args.id", async () => {
    try {
      const args: MutationUpdateAgendaItemArgs = {
        id: Types.ObjectId().toString(),
        input: {
          updatedBy: testUser?._id,
        },
      };

      const context = {
        userId: testUser?._id,
      };

      if (updateAgendaItem) {
        await updateAgendaItem({}, args, context);
      } else {
        throw new Error("updateAgendaItem resolver is undefined");
      }
    } catch (error: any) {
      expect(error.message).toEqual(AGENDA_ITEM_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it("throws UnauthorizedError if user is not the creator of the agenda item", async () => {
    try {
      const agendaItem = await AgendaItemModel.create({
        createdBy: Types.ObjectId().toString(),
        // Add other fields for the agenda item as needed
      });

      const args: MutationUpdateAgendaItemArgs = {
        id: agendaItem._id.toString(),
        input: {
          updatedBy: testUser?._id,
          // Add other fields for the input as needed
        },
      };

      const context = {
        userId: testUser?._id,
      };

      if (updateAgendaItem) {
        await updateAgendaItem({}, args, context);
      } else {
        throw new Error("updateAgendaItem resolver is undefined");
      }
    } catch (error: any) {
      expect(error.message).toEqual(
        UNAUTHORIZED_UPDATE_AGENDA_ITEM_ERROR.MESSAGE
      );
    }
  });

  it("updates the agenda item if user is the creator", async () => {
    const agendaItem = await AgendaItemModel.create({
      createdBy: testUser?._id,
      // Add other fields for the agenda item as needed
    });

    const args: MutationUpdateAgendaItemArgs = {
      id: agendaItem._id.toString(),
      input: {
        updatedBy: testUser?._id,
        // Add other fields for the input as needed
      },
    };

    const context = {
      userId: testUser?._id,
    };

    if (updateAgendaItem) {
      const result = await updateAgendaItem({}, args, context);
      expect(result).toBeDefined();

      // Check if the agenda item is updated in the database
      const updatedAgendaItem = await AgendaItemModel.findOne({
        _id: args.id,
      }).lean();
      expect(updatedAgendaItem).toBeDefined();
      // Add assertions for other fields in the updated agenda item as needed
    } else {
      throw new Error("updateAgendaItem resolver is undefined");
    }
  });
});
