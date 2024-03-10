import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { Organization } from "../../../src/models";
import type { MutationAddOrganizationImageArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import { addOrganizationImage as addOrganizationImageResolver } from "../../../src/resolvers/Mutation/addOrganizationImage";
import * as uploadEncodedImage from "../../../src/utilities/encodedImageStorage/uploadEncodedImage";
import { ORGANIZATION_NOT_FOUND_ERROR } from "../../../src/constants";
import { nanoid } from "nanoid";
import {
  beforeAll,
  afterAll,
  describe,
  it,
  expect,
  vi,
  afterEach,
} from "vitest";
import type {
  TestUserType,
  TestOrganizationType,
} from "../../helpers/userAndOrg";
import { createTestUserAndOrganization } from "../../helpers/userAndOrg";

const testImagePath = `${nanoid().toLowerCase()}test.png`;
let testUser: TestUserType;
let testOrganization: TestOrganizationType;
let MONGOOSE_INSTANCE: typeof mongoose;

vi.mock("../../utilities/uploadEncodedImage", () => ({
  uploadEncodedImage: vi.fn(),
}));

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const resultArray = await createTestUserAndOrganization();
  testUser = resultArray[0];
  testOrganization = resultArray[1];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> addOrganizationImage", () => {
  afterEach(() => {
    vi.doUnmock("../../../src/constants");
    vi.resetModules();
  });

  it(`throws NotFoundError if no organization exists with _id === args.organizationId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const args: MutationAddOrganizationImageArgs = {
        organizationId: new Types.ObjectId().toString(),
        file: "",
      };
      const context = {
        userId: testUser?.id,
      };

      const { addOrganizationImage } = await import(
        "../../../src/resolvers/Mutation/addOrganizationImage"
      );
      await addOrganizationImage?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toBeCalledWith(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        ORGANIZATION_NOT_FOUND_ERROR.MESSAGE,
      );
    }
  });
  it(`updates organization's image with the old image and returns the updated organization`, async () => {
    await Organization.updateOne(
      {
        _id: testOrganization?._id,
      },
      {
        $set: {
          image: testImagePath,
        },
      },
    );
    vi.spyOn(uploadEncodedImage, "uploadEncodedImage").mockImplementation(
      async (encodedImageURL: string) => encodedImageURL,
    );
    const args: MutationAddOrganizationImageArgs = {
      organizationId: testOrganization?.id,
      file: testImagePath,
    };
    const context = {
      userId: testUser?._id,
    };
    const addOrganizationImagePayload = await addOrganizationImageResolver?.(
      {},
      args,
      context,
    );
    const updatedTestOrganization = await Organization.findOne({
      _id: testOrganization?._id,
    }).lean();
    expect(addOrganizationImagePayload).toEqual(updatedTestOrganization);
    expect(addOrganizationImagePayload?.image).toEqual(testImagePath);
  });
});
