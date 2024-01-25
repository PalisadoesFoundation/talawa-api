import { Types } from "mongoose";
import type mongoose from "mongoose";
import type { MutationResolvers , MutationUpdateAgendaSectionArgs } from "../../../src/types/generatedGraphQLTypes";
import {
  AGENDA_SECTION_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { AgendaSectionModel, User } from "../../../src/models";
import { errors, requestContext } from "../../../src/libraries";
import { connect, disconnect } from "../../helpers/db";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import { updateAgendaSection } from "../../../src/resolvers/Mutation/updateAgendaSection";
import { createTestUser } from "../../helpers/userAndOrg";

let testUser: TestUserType;
let testAdminUser: TestUserType;
let MONGOOSE_INSTANCE: typeof mongoose;
let testAgendaSection: any;

import type {
  TestUserType,
  TestOrganizationType,
} from "../../helpers/userAndOrg";

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  testUser = await createTestUser();
  testAdminUser = await createTestUser();

  testAgendaSection = await AgendaSectionModel.create({
    createdBy: testAdminUser?._id,
    updatedAt: Date.now(),
    createdAt: Date.now(),
    title: "Test Section",
    description: "Sample Section",
    sequence: 1,
  });

  await User.updateOne(
    {
      _id: testAdminUser?._id,
    },
    {
      $push: {
        createdAgendaSections: [testAgendaSection],
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

describe("resolvers -> Mutation -> updateAgendaSection", () => {
  it("throws NotFoundError if no user exists with _id === userID", async () => {
    try {
      const args: MutationUpdateAgendaSectionArgs = {
        id: "",
        input: {
          updatedBy: Types.ObjectId().toString(),
        },
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };
      await updateAgendaSection?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });
  it("throws NotFoundError if no agenda section exists with _id === args.id", async () => {
    try {
      const args: MutationUpdateAgendaSectionArgs = {
        id: Types.ObjectId().toString(),
        input: {
          updatedBy: testAdminUser?._id,
        },
      };

      const context = {
        userId: testAdminUser?._id,
      };
      await updateAgendaSection?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(AGENDA_SECTION_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it("throws UnauthorizedError if user is not the creator of the agenda section", async () => {
    try {
      const args: MutationUpdateAgendaSectionArgs = {
        id: testAgendaSection._id.toString(),
        input: {
          updatedBy: testUser?._id,
        },
      };

      const context = {
        userId: testUser?._id,
      };
      await updateAgendaSection?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
    }
  });

  it("updates the agenda section successfully", async () => {
    const args: MutationUpdateAgendaSectionArgs = {
      id: testAgendaSection._id.toString(),
      input: {
        updatedBy: testAdminUser?._id,
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
      context
    );

    const testUpdateAgendaSectionPayload = await AgendaSectionModel.findOne({
      _id: testAgendaSection?._id,
    }).lean();

    expect(updateAgendaSectionPayload).toEqual(testUpdateAgendaSectionPayload);
  });
});
