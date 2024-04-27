import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { Organization, User } from "../../../src/models";
import type { MutationUpdateOrganizationArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
} from "../../../src/constants";
import { updateOrganization as updateOrganizationResolver } from "../../../src/resolvers/Mutation/updateOrganization";
import * as uploadEncodedImage from "../../../src/utilities/encodedImageStorage/uploadEncodedImage";
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";
import { createTestUserAndOrganization } from "../../helpers/userAndOrg";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;
let testOrganization: TestOrganizationType;

vi.mock("../../utilities/uploadEncodedImage", () => ({
  uploadEncodedImage: vi.fn(),
}));

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const temp = await createTestUserAndOrganization();
  testUser = temp[0];
  testOrganization = temp[1];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

afterEach(() => {
  vi.doUnmock("../../../src/constants");
  vi.resetModules();
});

afterEach(() => {
  vi.doUnmock("../../../src/constants");
  vi.resetModules();
});

describe("resolvers -> Mutation -> updateOrganization", () => {
  it(`throws NotFoundError if no organization exists with _id === args.id`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);

    try {
      const args: MutationUpdateOrganizationArgs = {
        id: new Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser?._id,
      };

      const { updateOrganization: updateOrganizationResolver } = await import(
        "../../../src/resolvers/Mutation/updateOrganization"
      );

      await updateOrganizationResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toHaveBeenCalledWith(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        `Translated ${ORGANIZATION_NOT_FOUND_ERROR.MESSAGE}`,
      );
    }
  });

  it(`throws UnauthorizedError if user with _id === context.userId is not an admin
  of organization with _id === args.id`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);

    try {
      const args: MutationUpdateOrganizationArgs = {
        id: testOrganization?._id,
      };

      const context = {
        userId: testUser?._id,
      };

      const { updateOrganization: updateOrganizationResolver } = await import(
        "../../../src/resolvers/Mutation/updateOrganization"
      );

      await updateOrganizationResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toHaveBeenCalledWith(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_ERROR.MESSAGE}`,
      );
    }
  });

  it(`updates the organization with _id === args.id and returns the updated organization`, async () => {
    await Organization.updateOne(
      {
        _id: testOrganization?._id,
      },
      {
        $set: {
          admins: [testUser?._id],
        },
      },
    );

    await User.updateOne(
      {
        _id: testUser?._id,
      },
      {
        $set: {
          adminFor: [testOrganization?._id],
        },
      },
    );

    const args: MutationUpdateOrganizationArgs = {
      id: testOrganization?._id,
      data: {
        description: "newDescription",
        userRegistrationRequired: false,
        name: "newName",
        visibleInSearch: false,
      },
    };

    const context = {
      userId: testUser?._id,
    };

    const { updateOrganization: updateOrganizationResolver } = await import(
      "../../../src/resolvers/Mutation/updateOrganization"
    );

    const updateOrganizationPayload = await updateOrganizationResolver?.(
      {},
      args,
      context,
    );

    const testUpdateOrganizationPayload = await Organization.findOne({
      _id: testOrganization?._id,
    }).lean();

    expect(updateOrganizationPayload).toEqual(testUpdateOrganizationPayload);
  });

  it(`updates the organization with _id === args.id and returns the updated organization when image is given`, async () => {
    await Organization.updateOne(
      {
        _id: testOrganization?._id,
      },
      {
        $set: {
          admins: [testUser?._id],
        },
      },
    );

    await User.updateOne(
      {
        _id: testUser?._id,
      },
      {
        $set: {
          adminFor: [testOrganization?._id],
        },
      },
    );

    const args: MutationUpdateOrganizationArgs = {
      id: testOrganization?._id,
      data: {
        description: "newDescription",
        userRegistrationRequired: false,
        name: "newName",
        visibleInSearch: false,
      },

      file: "newImageFile.png",
    };

    vi.spyOn(uploadEncodedImage, "uploadEncodedImage").mockImplementation(
      async (encodedImageURL: string) => encodedImageURL,
    );

    const context = {
      userId: testUser?._id,
    };

    const updateOrganizationPayload = await updateOrganizationResolver?.(
      {},
      args,
      context,
    );

    const testUpdateOrganizationPayload = await Organization.findOne({
      _id: testOrganization?._id,
    }).lean();

    expect(updateOrganizationPayload).toEqual(testUpdateOrganizationPayload);
  });
});
