import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import type { MutationCreateUserTagArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import {
  USER_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_TO_CREATE_TAG,
  INCORRECT_TAG_INPUT,
  ORGANIZATION_NOT_FOUND_ERROR,
  TAG_NOT_FOUND,
  TAG_ALREADY_EXISTS,
  USER_NOT_AUTHORIZED_ERROR,
} from "../../../src/constants";
import {
  beforeAll,
  afterAll,
  describe,
  it,
  expect,
  afterEach,
  vi,
} from "vitest";
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";
import { createTestUser } from "../../helpers/userAndOrg";
import { AppUserProfile, OrganizationTagUser } from "../../../src/models";
import type { TestUserTagType } from "../../helpers/tags";
import { createRootTagWithOrg } from "../../helpers/tags";

let testUser: TestUserType;
let randomUser: TestUserType;
let testOrganization: TestOrganizationType;
let testTag: TestUserTagType;
let randomTestTag: TestUserTagType;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();

  [testUser, testOrganization, testTag] = await createRootTagWithOrg();
  [, , randomTestTag] = await createRootTagWithOrg();
  randomUser = await createTestUser();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> createUserTag", () => {
  afterEach(() => {
    vi.doUnmock("../../../src/constants");
    vi.resetModules();
    vi.resetAllMocks();
  });

  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationCreateUserTagArgs = {
        input: {
          organizationId: new Types.ObjectId().toString(),
          name: "TestUserTag",
          tagColor: "#000000",
        },
      };

      const context = {
        userId: new Types.ObjectId().toString(),
      };

      const { createUserTag: createUserTagResolver } = await import(
        "../../../src/resolvers/Mutation/createUserTag"
      );

      await createUserTagResolver?.({}, args, context);
    } catch (error: unknown) {
      if (!(error instanceof Error)) {
        throw new Error("Expected an error to be thrown");
      }
      expect(spy).toBeCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect(error.message).toEqual(
        `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`,
      );
    }
  });

  it(`throws NotFoundError if no organization exists with _id === args.input.organizationId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationCreateUserTagArgs = {
        input: {
          organizationId: new Types.ObjectId().toString(),
          name: "TestUserTag",
          tagColor: "#000000",
        },
      };

      const context = {
        userId: testUser?.id,
      };

      const { createUserTag: createUserTagResolver } = await import(
        "../../../src/resolvers/Mutation/createUserTag"
      );

      await createUserTagResolver?.({}, args, context);
    } catch (error: unknown) {
      if (!(error instanceof Error)) {
        throw new Error("Expected an error to be thrown");
      }
      expect(spy).toBeCalledWith(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE);
      expect(error.message).toEqual(
        `Translated ${ORGANIZATION_NOT_FOUND_ERROR.MESSAGE}`,
      );
    }
  });

  it(`throws TAG_NOT_FOUND error if the parentTagId is provided (not null) but no tag exists with _id === args.input.parentTagId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationCreateUserTagArgs = {
        input: {
          organizationId: testOrganization?._id,
          name: "TestUserTag",
          parentTagId: new Types.ObjectId().toString(),
          tagColor: "#000000",
        },
      };

      const context = {
        userId: testUser?.id,
      };

      const { createUserTag: createUserTagResolver } = await import(
        "../../../src/resolvers/Mutation/createUserTag"
      );

      await createUserTagResolver?.({}, args, context);
    } catch (error: unknown) {
      if (!(error instanceof Error)) {
        throw new Error("Expected an error to be thrown");
      }
      expect(spy).toBeCalledWith(TAG_NOT_FOUND.MESSAGE);
      expect(error.message).toEqual(`Translated ${TAG_NOT_FOUND.MESSAGE}`);
    }
  });

  it(`throws INCORRECT_TAG_INPUT error if the parent tag is provided (not null) but the parent tag doesn't belong to the provided organization (specified by args.input.organizationId)`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationCreateUserTagArgs = {
        input: {
          organizationId: testOrganization?._id,
          name: "TestUserTag",
          parentTagId: randomTestTag?._id.toString(),
          tagColor: "#000000",
        },
      };

      const context = {
        userId: testUser?.id,
      };

      const { createUserTag: createUserTagResolver } = await import(
        "../../../src/resolvers/Mutation/createUserTag"
      );

      await createUserTagResolver?.({}, args, context);
    } catch (error: unknown) {
      if (!(error instanceof Error)) {
        throw new Error("Expected an error to be thrown");
      }
      expect(spy).toBeCalledWith(INCORRECT_TAG_INPUT.MESSAGE);
      expect(error.message).toEqual(
        `Translated ${INCORRECT_TAG_INPUT.MESSAGE}`,
      );
    }
  });

  it(`throws USER_NOT_AUTHORIZED_TO_CREATE_TAG error if the user is not authorized to create the tag`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationCreateUserTagArgs = {
        input: {
          organizationId: testOrganization?._id,
          name: "TestUserTag",
          parentTagId: testTag?._id.toString(),
          tagColor: "#000000",
        },
      };

      const context = {
        userId: randomUser?.id,
      };

      const { createUserTag: createUserTagResolver } = await import(
        "../../../src/resolvers/Mutation/createUserTag"
      );

      await createUserTagResolver?.({}, args, context);
    } catch (error: unknown) {
      if (!(error instanceof Error)) {
        throw new Error("Expected an error to be thrown");
      }
      expect(spy).toBeCalledWith(USER_NOT_AUTHORIZED_TO_CREATE_TAG.MESSAGE);
      expect(error.message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_TO_CREATE_TAG.MESSAGE}`,
      );
    }
  });

  it(`throws TAG_ALREADY_EXISTS error if the tag with the same name and same parent already exists`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationCreateUserTagArgs = {
        input: {
          organizationId: testOrganization?._id,
          name: testTag?.name ?? "",
          parentTagId: testTag?.parentTagId,
          tagColor: testTag?.tagColor ?? "",
        },
      };

      const context = {
        userId: testUser?.id,
      };

      const { createUserTag: createUserTagResolver } = await import(
        "../../../src/resolvers/Mutation/createUserTag"
      );

      await createUserTagResolver?.({}, args, context);
    } catch (error: unknown) {
      if (!(error instanceof Error)) {
        throw new Error("Expected an error to be thrown");
      }
      expect(spy).toBeCalledWith(TAG_ALREADY_EXISTS.MESSAGE);
      expect(error.message).toEqual(`Translated ${TAG_ALREADY_EXISTS.MESSAGE}`);
    }
  });

  it(`tag should be successfully added`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementationOnce(
      (message) => `Translated ${message}`,
    );

    const args: MutationCreateUserTagArgs = {
      input: {
        organizationId: testOrganization?._id,
        name: "TestUserTag",
        parentTagId: testTag?._id.toString(),
        tagColor: "#000000",
      },
    };

    const context = {
      userId: testUser?.id,
    };

    const { createUserTag: createUserTagResolver } = await import(
      "../../../src/resolvers/Mutation/createUserTag"
    );

    const createdTag = await createUserTagResolver?.({}, args, context);

    expect(createdTag).toEqual(
      expect.objectContaining({
        organizationId: testOrganization?._id,
        name: "TestUserTag",
        parentTagId: testTag?._id,
      }),
    );

    const createdTagExists = await OrganizationTagUser.exists({
      _id: createdTag?._id,
    });

    expect(createdTagExists).toBeTruthy();
  });

  it("throws an error if the user does not have appUserProfile", async () => {
    await AppUserProfile.deleteOne({
      userId: testUser?._id,
    });
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);
    try {
      const args: MutationCreateUserTagArgs = {
        input: {
          organizationId: new Types.ObjectId().toString(),
          name: "TestUserTag",
          tagColor: "#000000",
        },
      };

      const context = {
        userId: testUser?.id,
      };

      const { createUserTag: createUserTagResolver } = await import(
        "../../../src/resolvers/Mutation/createUserTag"
      );

      await createUserTagResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toBeCalledWith(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
      if (!(error instanceof Error)) {
        throw new Error("Expected an error to be thrown");
      }
      expect(error.message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_ERROR.MESSAGE}`,
      );
    }
  });
});
