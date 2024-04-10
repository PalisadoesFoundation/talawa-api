import { Types } from "mongoose";
import type mongoose from "mongoose";
import type { MutationUpdateAgendaSectionArgs } from "../../../src/types/generatedGraphQLTypes";
import {
  AGENDA_SECTION_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { AgendaSectionModel, AppUserProfile, User } from "../../../src/models";
import { connect, disconnect } from "../../helpers/db";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import { updateAgendaSection } from "../../../src/resolvers/Mutation/updateAgendaSection";
import { createTestUser } from "../../helpers/userAndOrg";

let testUser: TestUserType;
let testAdminUser: TestUserType;
let MONGOOSE_INSTANCE: typeof mongoose;
let testAgendaSection: TestAgendaSectionType;

import type { TestUserType } from "../../helpers/userAndOrg";
import type { TestAgendaSectionType } from "../../helpers/agendaSection";

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  testUser = await createTestUser();
  testAdminUser = await createTestUser();

  testAgendaSection = await AgendaSectionModel.create({
    createdBy: testAdminUser?._id,
    title: "Test Section",
    description: "Sample Section",
    sequence: 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    updatedBy: testAdminUser?._id,
  });

  await User.updateOne(
    {
      _id: testAdminUser?._id,
    },
    {
      $push: {
        createdAgendaSections: [testAgendaSection],
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

describe("resolvers -> Mutation -> updateAgendaSection", () => {
  it("throws NotFoundError if no user exists with _id === userID", async () => {
    try {
      const args: MutationUpdateAgendaSectionArgs = {
        id: "",
        input: {},
      };

      const context = {
        userId: new Types.ObjectId().toString(),
      };
      await updateAgendaSection?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });
  it("throws NotFoundError if no agenda section exists with _id === args.id", async () => {
    try {
      const args: MutationUpdateAgendaSectionArgs = {
        id: new Types.ObjectId().toString(),
        input: {},
      };

      const context = {
        userId: testAdminUser?._id,
      };
      await updateAgendaSection?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        AGENDA_SECTION_NOT_FOUND_ERROR.MESSAGE,
      );
    }
  });

  it("throws UnauthorizedError if user is not the creator of the agenda section", async () => {
    try {
      const args: MutationUpdateAgendaSectionArgs = {
        id: testAgendaSection._id.toString(),
        input: {},
      };

      const context = {
        userId: testUser?._id,
      };
      await updateAgendaSection?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        USER_NOT_AUTHORIZED_ERROR.MESSAGE,
      );
    }
  });

  it("updates the agenda section successfully", async () => {
    const args: MutationUpdateAgendaSectionArgs = {
      id: testAgendaSection._id.toString(),
      input: {
        description: "Updated Sample Section",
        sequence: 2,
      },
    };

    const context = {
      userId: testAdminUser?._id,
    };

    const { updateAgendaSection: updateAgendaSectionResolver } = await import(
      "../../../src/resolvers/Mutation/updateAgendaSection"
    );

    const updateAgendaSectionPayload = await updateAgendaSectionResolver?.(
      {},
      args,
      context,
    );

    // const testUpdateAgendaSectionPayload = await AgendaSectionModel.findOne({
    //   _id: testAgendaSection?._id,
    // }).lean();

    expect(updateAgendaSectionPayload).toBeDefined();
  });

  it("throws UnauthorizedError if the user does not have an app profile", async () => {
    await AppUserProfile.deleteOne({ userId: testAdminUser?._id });

    try {
      const args: MutationUpdateAgendaSectionArgs = {
        id: testAgendaSection._id.toString(),
        input: {},
      };

      const context = {
        userId: testAdminUser?._id,
      };
      await updateAgendaSection?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        USER_NOT_AUTHORIZED_ERROR.MESSAGE,
      );
    }
  });
});
