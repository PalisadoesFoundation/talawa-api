import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import type {
  MutationAssignUserTagArgs,
  TransactionLog,
} from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import {
  USER_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  TAG_NOT_FOUND,
  USER_DOES_NOT_BELONG_TO_TAGS_ORGANIZATION,
  USER_ALREADY_HAS_TAG,
  TRANSACTION_LOG_TYPES,
} from "../../../src/constants";
import {
  beforeAll,
  afterAll,
  describe,
  it,
  expect,
  vi,
  afterEach,
} from "vitest";
import type { TestUserType } from "../../helpers/userAndOrg";
import { createTestUser } from "../../helpers/userAndOrg";
import type { TestUserTagType } from "../../helpers/tags";
import { createRootTagWithOrg } from "../../helpers/tags";
import { TagUser } from "../../../src/models";
import { wait } from "./acceptAdmin.spec";
import { getTransactionLogs } from "../../../src/resolvers/Query/getTransactionLogs";

let MONGOOSE_INSTANCE: typeof mongoose;

let adminUser: TestUserType;
let testTag: TestUserTagType;
let randomUser: TestUserType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [adminUser, , testTag] = await createRootTagWithOrg();
  randomUser = await createTestUser();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> assignUserTag", () => {
  afterEach(() => {
    vi.doUnmock("../../../src/constants");
    vi.resetModules();
    vi.resetAllMocks();
  });

  it(`throws NotFoundError if no user exists with _id === context.userId `, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationAssignUserTagArgs = {
        input: {
          userId: adminUser?._id,
          tagId: testTag?._id.toString() ?? "",
        },
      };

      const context = { userId: Types.ObjectId().toString() };

      const { assignUserTag: assignUserTagResolver } = await import(
        "../../../src/resolvers/Mutation/assignUserTag"
      );

      await assignUserTagResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(
        `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`
      );
      expect(spy).toHaveBeenLastCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws NotFoundError if no user exists with _id === args.input.userId `, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationAssignUserTagArgs = {
        input: {
          userId: Types.ObjectId().toString(),
          tagId: testTag?._id.toString() ?? "",
        },
      };

      const context = { userId: adminUser?._id };

      const { assignUserTag: assignUserTagResolver } = await import(
        "../../../src/resolvers/Mutation/assignUserTag"
      );

      await assignUserTagResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(
        `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`
      );
      expect(spy).toHaveBeenLastCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws NotFoundError if no tag exists with _id === args.input.tagId `, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationAssignUserTagArgs = {
        input: {
          userId: adminUser?._id,
          tagId: Types.ObjectId().toString(),
        },
      };

      const context = {
        userId: adminUser?._id,
      };

      const { assignUserTag: assignUserTagResolver } = await import(
        "../../../src/resolvers/Mutation/assignUserTag"
      );

      await assignUserTagResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toHaveBeenLastCalledWith(TAG_NOT_FOUND.MESSAGE);
      expect(error.message).toEqual(`Translated ${TAG_NOT_FOUND.MESSAGE}`);
    }
  });

  it(`throws Not Authorized Error if the current user is not a superadmin or admin of the organization of the tag being assigned`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationAssignUserTagArgs = {
        input: {
          userId: adminUser?._id,
          tagId: testTag?._id.toString() ?? "",
        },
      };

      const context = {
        userId: randomUser?._id,
      };

      const { assignUserTag: assignUserTagResolver } = await import(
        "../../../src/resolvers/Mutation/assignUserTag"
      );

      await assignUserTagResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_ERROR.MESSAGE}`
      );
      expect(spy).toHaveBeenLastCalledWith(
        `${USER_NOT_AUTHORIZED_ERROR.MESSAGE}`
      );
    }
  });

  it(`throws Error if the request user is not a member of organization of the tag being assigned`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationAssignUserTagArgs = {
        input: {
          userId: randomUser?._id,
          tagId: testTag?._id.toString() ?? "",
        },
      };

      const context = {
        userId: adminUser?._id,
      };

      const { assignUserTag: assignUserTagResolver } = await import(
        "../../../src/resolvers/Mutation/assignUserTag"
      );

      await assignUserTagResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(
        `Translated ${USER_DOES_NOT_BELONG_TO_TAGS_ORGANIZATION.MESSAGE}`
      );
      expect(spy).toHaveBeenLastCalledWith(
        `${USER_DOES_NOT_BELONG_TO_TAGS_ORGANIZATION.MESSAGE}`
      );
    }
  });

  it(`Tag assign should be successful and the user who has been assigned the tag is returned`, async () => {
    const args: MutationAssignUserTagArgs = {
      input: {
        userId: adminUser?._id,
        tagId: testTag?._id.toString() ?? "",
      },
    };
    const context = {
      userId: adminUser?._id,
    };

    const { assignUserTag: assignUserTagResolver } = await import(
      "../../../src/resolvers/Mutation/assignUserTag"
    );

    const payload = await assignUserTagResolver?.({}, args, context);

    expect(payload?._id.toString()).toEqual(adminUser?._id.toString());

    const tagAssigned = await TagUser.exists({
      ...args.input,
    });

    expect(tagAssigned).toBeTruthy();

    await wait();

    const mostRecentTransactions = getTransactionLogs!({}, {}, {})!;

    expect((mostRecentTransactions as TransactionLog[])[0]).toMatchObject({
      createdBy: adminUser?._id.toString(),
      type: TRANSACTION_LOG_TYPES.CREATE,
      model: "TagUser",
    });
  });

  it(`Throws USER_ALREADY_HAS_TAG error if tag with _id === args.input.tagId is already assigned to user with _id === args.input.userId`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationAssignUserTagArgs = {
        input: {
          userId: adminUser?._id,
          tagId: testTag?._id.toString() ?? "",
        },
      };
      const context = {
        userId: adminUser?._id,
      };

      const { assignUserTag: assignUserTagResolver } = await import(
        "../../../src/resolvers/Mutation/assignUserTag"
      );

      await assignUserTagResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(
        `Translated ${USER_ALREADY_HAS_TAG.MESSAGE}`
      );
      expect(spy).toHaveBeenLastCalledWith(`${USER_ALREADY_HAS_TAG.MESSAGE}`);
    }
  });
});
