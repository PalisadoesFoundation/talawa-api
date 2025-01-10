import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import type { MutationUpdateAgendaCategoryArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import {
  USER_NOT_FOUND_ERROR,
  AGENDA_CATEGORY_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
} from "../../../src/constants";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import { updateAgendaCategory as updateAgendaCategoryResolver } from "../../../src/resolvers/Mutation/updateAgendaCategory";
import {
  AgendaCategoryModel,
  AppUserProfile,
  Organization,
} from "../../../src/models";
import type { TestUserType } from "../../helpers/user";
import { createTestUser } from "../../helpers/user";
import type { TestOrganizationType } from "../../helpers/userAndOrg";
import type { TestAgendaCategoryType } from "../../helpers/agendaCategory";

let testAgendaCategory: TestAgendaCategoryType;
let randomUser: TestUserType;
let testUser: TestUserType;
let MONGOOSE_INSTANCE: typeof mongoose;
let testOrganization: TestOrganizationType;
let testAdminUser: TestUserType;
beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const { requestContext } = await import("../../../src/libraries");
  vi.spyOn(requestContext, "translate").mockImplementation(
    (message) => message,
  );

  randomUser = await createTestUser();
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

  testAgendaCategory = await AgendaCategoryModel.create({
    name: "Sample Agenda Category",
    organization: testOrganization?._id,
    createdBy: testAdminUser?._id,
    createdAt: new Date(),
  });
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> updateAgendaCategory", () => {
  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    try {
      const args: MutationUpdateAgendaCategoryArgs = {
        id: new Types.ObjectId().toString(),
        input: {
          name: "Updated Name",
          description: "Updated Description",
        },
      };

      const context = {
        userId: new Types.ObjectId().toString(),
      };

      await updateAgendaCategoryResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws NotFoundError if no agenda category exists with _id === args.id`, async () => {
    try {
      const args: MutationUpdateAgendaCategoryArgs = {
        id: new Types.ObjectId().toString(),
        input: {
          name: "Updated Name",
          description: "Updated Description",
        },
      };

      const context = {
        userId: testUser?._id,
      };

      await updateAgendaCategoryResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        AGENDA_CATEGORY_NOT_FOUND_ERROR.MESSAGE,
      );
    }
  });

  it(`throws UnauthorizedError if the user is not the creator of the agenda category`, async () => {
    try {
      const args: MutationUpdateAgendaCategoryArgs = {
        id: testAgendaCategory?._id,
        input: {
          name: "Updated Name",
          description: "Updated Description",
        },
      };

      const context = {
        userId: randomUser?._id,
      };

      await updateAgendaCategoryResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        USER_NOT_AUTHORIZED_ERROR.MESSAGE,
      );
    }
  });

  it(`updates the agenda category and returns it for the creator`, async () => {
    const args: MutationUpdateAgendaCategoryArgs = {
      id: testAgendaCategory?._id,
      input: {
        name: "Updated Name",
        description: "Updated Description",
      },
    };
    await AppUserProfile.findOneAndUpdate(
      { userId: testUser?._id },
      {
        $set: {
          adminFor: [testOrganization?._id.toString()],
          isSuperAdmin: true,
        },
      },
      { new: true, upsert: true },
    );
    const context = {
      userId: testUser?._id,
    };

    const updatedAgendaCategoryPayload = await updateAgendaCategoryResolver?.(
      {},
      args,
      context,
    );

    expect(updatedAgendaCategoryPayload).toEqual(
      expect.objectContaining({
        name: "Updated Name",
        description: "Updated Description",
      }),
    );
  });
  //   it(`updates the agenda category and returns it for the admin`, async () => {
  //   const args: MutationUpdateAgendaCategoryArgs = {
  //     id: testAgendaCategory?._id,
  //     input: {
  //       name: "Updated Name",
  //       description: "Updated Description",
  //     },
  //   };

  //   const context = {
  //     userId: testAdminUser?._id,
  //   };

  //   const updatedAgendaCategoryPayload = await updateAgendaCategoryResolver?.(
  //     {},
  //     args,
  //     context
  //   );

  //   expect(updatedAgendaCategoryPayload).toEqual(
  //     expect.objectContaining({
  //       name: "Updated Name",
  //       description: "Updated Description",
  //     })
  //   );
  // });
  it(`updates the agenda category and returns it as superadmin`, async () => {
    await AppUserProfile.findOneAndUpdate(
      {
        userId: testUser?._id,
      },
      {
        isSuperAdmin: true,
      },
      {
        new: true,
      },
    );
    const context = {
      userId: testUser?._id,
    };
    const args: MutationUpdateAgendaCategoryArgs = {
      id: testAgendaCategory?._id,
      input: {
        name: "Updated Name",
        description: "Updated Description",
      },
    };

    const updatedAgendaCategoryPayload = await updateAgendaCategoryResolver?.(
      {},
      args,
      context,
    );

    expect(updatedAgendaCategoryPayload).toEqual(
      expect.objectContaining({
        name: "Updated Name",
        description: "Updated Description",
      }),
    );
  });
  it("throws an error if the user does not have appUserProfile", async () => {
    await AppUserProfile.deleteOne({
      userId: testUser?._id,
    });
    const args: MutationUpdateAgendaCategoryArgs = {
      id: testAgendaCategory?._id,
      input: {
        name: "Updated Name",
        description: "Updated Description",
      },
    };

    const context = {
      userId: testUser?._id,
    };

    try {
      await updateAgendaCategoryResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        USER_NOT_AUTHORIZED_ERROR.MESSAGE,
      );
    }
  });
});
