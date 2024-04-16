import type mongoose from "mongoose";
import { Types } from "mongoose";
import { connect, disconnect } from "../../helpers/db";
import { deleteAgendaCategory } from "../../../src/resolvers/Mutation/deleteAgendaCategory";
import {
  User,
  AgendaCategoryModel,
  Organization,
  AppUserProfile,
} from "../../../src/models";
import {
  AGENDA_CATEGORY_NOT_FOUND_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import { createTestUser } from "../../helpers/userAndOrg";
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";
import type { MutationDeleteAgendaCategoryArgs } from "../../../src/types/generatedGraphQLTypes";
import type { TestAgendaCategoryType } from "../../helpers/agendaCategory";
let testUser: TestUserType;
let MONGOOSE_INSTANCE: typeof mongoose;
let testAdminUser: TestUserType;
let sampleAgendaCategory: TestAgendaCategoryType;
let testOrganization: TestOrganizationType;
let randomUser: TestUserType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  testUser = await createTestUser();
  testAdminUser = await createTestUser();
  randomUser = await createTestUser();
  testOrganization = await Organization.create({
    name: "name",
    description: "description",
    isPublic: true,
    creator: testUser?._id,
    admins: [testAdminUser?._id],
    members: [testUser?._id, testAdminUser?._id],
    creatorId: testUser?._id,
  });

  await User.updateOne(
    {
      _id: testAdminUser?._id,
    },
    {
      $set: {
        joinedOrganizations: [testOrganization._id],
        adminFor: [testOrganization._id],
      },
    },
  );

  await AppUserProfile.updateOne(
    {
      userId: testAdminUser?._id,
    },
    {
      $set: {
        createdOrganizations: [testOrganization._id],
        adminFor: [testOrganization._id],
      },
    },
  );
  sampleAgendaCategory = await AgendaCategoryModel.create({
    name: "Sample Agenda Category",
    organizationId: testOrganization?._id,
    createdBy: testAdminUser?._id,
    createdAt: new Date(),
  });
  const { requestContext } = await import("../../../src/libraries");
  vi.spyOn(requestContext, "translate").mockImplementation(
    (message) => message,
  );
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> deleteAgendaCategory", () => {
  it("throws NotFoundError if no user exists with the given ID", async () => {
    try {
      const args = {
        id: sampleAgendaCategory?._id,
      };
      const context = {
        userId: new Types.ObjectId().toString(),
      };

      await deleteAgendaCategory?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });
  it("throws NotFoundError if no agenda category exists with the given ID", async () => {
    try {
      const args = {
        id: new Types.ObjectId().toString(),
      };
      const context = {
        userId: testAdminUser?._id,
      };
      await deleteAgendaCategory?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        AGENDA_CATEGORY_NOT_FOUND_ERROR.MESSAGE,
      );
    }
  });

  it("throws UnauthorizedError if the user is not the creator of the agenda category", async () => {
    try {
      const args = {
        id: sampleAgendaCategory?._id,
      };
      const context = {
        userId: testUser?._id,
      };
      await deleteAgendaCategory?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        USER_NOT_AUTHORIZED_ERROR.MESSAGE,
      );
    }
  });

  it("throws UnauthorizedError if organizationId not found", async () => {
    const newSampleAgendaCategory = await AgendaCategoryModel.create({
      name: "Sample Agenda Categoryyyy",
      createdBy: testAdminUser?._id,
      createdAt: new Date(),
    });
    try {
      const args = {
        id: newSampleAgendaCategory?._id.toString(),
      };
      const context = {
        userId: testAdminUser?._id,
      };
      await deleteAgendaCategory?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        ORGANIZATION_NOT_FOUND_ERROR.MESSAGE,
      );
    }
  });

  it(`removes the agenda category and returns it as superadmin`, async () => {
    const superAdminTestUser = await User.findOneAndUpdate(
      {
        _id: randomUser?._id,
      },
      {
        userType: "SUPERADMIN",
      },
      {
        new: true,
      },
    );
    const newTestAgendaCategory = await AgendaCategoryModel.create({
      name: "Sample Agenda Category",
      organizationId: testOrganization?._id,
      createdBy: superAdminTestUser?._id,
      createdAt: Date.now(),
    });
    const args: MutationDeleteAgendaCategoryArgs = {
      id: newTestAgendaCategory?._id.toString(),
    };

    const context = {
      userId: superAdminTestUser?._id,
    };

    try {
      const removedAgendaCategoryPayload = await deleteAgendaCategory?.(
        {},
        args,
        context,
      );

      expect(removedAgendaCategoryPayload).toEqual(args.id);
    } catch (error) {
      expect((error as Error).message).toEqual(
        USER_NOT_AUTHORIZED_ERROR.MESSAGE,
      );
    }
  });
  it(` deletes an agenda category successfully and returns it to who created it `, async () => {
    const args: MutationDeleteAgendaCategoryArgs = {
      id: sampleAgendaCategory?._id,
    };

    const context = {
      userId: testAdminUser?._id,
    };
    try {
      const removedAgendaCategoryPayload = await deleteAgendaCategory?.(
        {},
        args,
        context,
      );

      expect(removedAgendaCategoryPayload).toEqual(args.id);
      const deletedAgendaCategory = await AgendaCategoryModel.findById(args.id);
      expect(deletedAgendaCategory).toBeNull();
    } catch (error) {
      expect((error as Error).message).toEqual(
        USER_NOT_AUTHORIZED_ERROR.MESSAGE,
      );
    }
  });
  it("throws an error if the user does not have appUserProfile", async () => {
    await AppUserProfile.deleteOne({
      userId: testUser?._id,
    });
    const args: MutationDeleteAgendaCategoryArgs = {
      id: sampleAgendaCategory?._id,
    };
    const context = {
      userId: testUser?._id,
    };

    try {
      await deleteAgendaCategory?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        USER_NOT_AUTHORIZED_ERROR.MESSAGE,
      );
    }
  });
});
