import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { User, AgendaSectionModel } from "../../../src/models";
import type { MutationRemoveAgendaSectionArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import removeAgendaSection from "../../../src/resolvers/Mutation/removeAgendaSection";
import {
  USER_NOT_FOUND_ERROR,
  AGENDA_SECTION_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
} from "../../../src/constants";
import { createTestUser } from "../../helpers/userAndOrg";

let testUser: TestUserType;
let testRandomUser: TestUserType;
let testRandomUser2: TestUserType;
let MONGOOSE_INSTANCE: typeof mongoose;

import type { TestUserType } from "../../helpers/userAndOrg";

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  testUser = await createTestUser();
  testRandomUser = await createTestUser();
  testRandomUser2 = await createTestUser();
  await User.updateOne(
    {
      _id: testUser?._id,
    },
    {
      $push: {
        createdAgendaSections: Types.ObjectId().toString(),
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

describe("resolvers -> Mutation -> removeAgendaSection", () => {
  it("throws NotFoundError if no user exists with _id === userId", async () => {
    try {
      const args: MutationRemoveAgendaSectionArgs = {
        id: Types.ObjectId().toString(),
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      if (removeAgendaSection) {
        await removeAgendaSection({}, args, context);
      } else {
        throw new Error("removeAgendaSection resolver is undefined");
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        expect(error.message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
      } else {
        throw new Error("An unknown error occurred.");
      }
    }
  });

  it("throws NotFoundError if no agenda section exists with _id === args.id", async () => {
    try {
      const args: MutationRemoveAgendaSectionArgs = {
        id: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser?._id,
      };

      if (removeAgendaSection) {
        await removeAgendaSection({}, args, context);
      } else {
        throw new Error("removeAgendaSection resolver is undefined");
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        expect(error.message).toEqual(AGENDA_SECTION_NOT_FOUND_ERROR.MESSAGE);
      } else {
        throw new Error("An unknown error occurred.");
      }
    }
  });

  it("throws UnauthorizedError if user is not the creator", async () => {
    try {
      const agendaSection = await AgendaSectionModel.create({
        createdBy: testUser?._id,
        sequence: 1,
        description: "Sample description...",
      });

      const args: MutationRemoveAgendaSectionArgs = {
        id: agendaSection._id.toString(),
      };

      const context = {
        userId: testUser?._id,
      };

      if (removeAgendaSection) {
        await removeAgendaSection({}, args, context);
      } else {
        throw new Error("removeAgendaSection resolver is undefined");
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        expect(error.message).toEqual(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
      } else {
        throw new Error("An unknown error occurred.");
      }
    }
  });

  it("throws UnauthorizedError if the user is not the superadmin  ", async () => {
    try {
      const agendaSection = await AgendaSectionModel.create({
        createdBy: testRandomUser2?._id,
        sequence: 1,
        description: "Sample description...",
      });

      const args: MutationRemoveAgendaSectionArgs = {
        id: agendaSection._id.toString(),
      };

      const context = {
        userId: testRandomUser?._id,
      };

      if (removeAgendaSection) {
        await removeAgendaSection({}, args, context);
      } else {
        throw new Error("removeAgendaSection resolver is undefined");
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        expect(error.message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
      } else {
        throw new Error("An unknown error occurred.");
      }
    }
  });

  it("removes the agenda section if user is the creator or superadmin", async () => {
    const agendaSection = await AgendaSectionModel.create({
      createdBy: testUser?._id,
      sequence: 3,
      description: "Sample description....!",
    });

    const args: MutationRemoveAgendaSectionArgs = {
      id: agendaSection._id.toString(),
    };

    const context = {
      userId: testUser?._id,
    };

    if (removeAgendaSection) {
      const result = await removeAgendaSection({}, args, context);
      expect(result).toEqual(args.id);

      const deletedAgendaSection = await AgendaSectionModel.findOne({
        _id: args.id,
      });

      expect(deletedAgendaSection).toBeNull();
    } else {
      throw new Error("removeAgendaSection resolver is undefined");
    }
  });
});
