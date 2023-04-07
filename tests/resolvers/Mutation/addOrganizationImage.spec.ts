import "dotenv/config";
import { Types } from "mongoose";
import { Organization } from "../../../src/models";
import { MutationAddOrganizationImageArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import mongoose from "mongoose";
import { addOrganizationImage as addOrganizationImageResolver } from "../../../src/resolvers/Mutation/addOrganizationImage";
import * as uploadEncodedImage from "../../../src/utilities/encodedImageStorage/uploadEncodedImage";
import {
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
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
import {
  TestUserType,
  TestOrganizationType,
  createTestUserAndOrganization,
} from "../../helpers/userAndOrg";

const testImagePath: string = `${nanoid().toLowerCase()}test.png`;
let testUser: TestUserType;
let testOrganization: TestOrganizationType;
let MONGOOSE_INSTANCE: typeof mongoose | null;

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
  await disconnect(MONGOOSE_INSTANCE!);
});

describe("resolvers -> Mutation -> addOrganizationImage", () => {
  afterEach(async () => {
    vi.doUnmock("../../../src/constants");
    vi.resetModules();
  });

  it("throws NotFoundError if no user exists with _id === context.userId", async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);

    try {
      const args: MutationAddOrganizationImageArgs = {
        organizationId: "",
        file: "",
      };
      const context = {
        userId: Types.ObjectId().toString(),
      };

      const { addOrganizationImage } = await import(
        "../../../src/resolvers/Mutation/addOrganizationImage"
      );
      await addOrganizationImage?.({}, args, context);
    } catch (error: any) {
      expect(spy).toBeCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect(error.message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });
  it(`throws NotFoundError if no organization exists with _id === args.organizationId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const args: MutationAddOrganizationImageArgs = {
        organizationId: Types.ObjectId().toString(),
        file: "",
      };
      const context = {
        userId: testUser!.id,
      };

      const { addOrganizationImage } = await import(
        "../../../src/resolvers/Mutation/addOrganizationImage"
      );
      await addOrganizationImage?.({}, args, context);
    } catch (error: any) {
      expect(spy).toBeCalledWith(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE);
      expect(error.message).toEqual(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE);
    }
  });
  it(`updates organization's image with the old image and returns the updated organization`, async () => {
    await Organization.updateOne(
      {
        _id: testOrganization!._id,
      },
      {
        $set: {
          image: testImagePath,
        },
      }
    );
    vi.spyOn(uploadEncodedImage, "uploadEncodedImage").mockImplementation(
      async (encodedImageURL: string) => encodedImageURL
    );
    const args: MutationAddOrganizationImageArgs = {
      organizationId: testOrganization!.id,
      file: testImagePath,
    };
    const context = {
      userId: testUser!._id,
    };
    const addOrganizationImagePayload = await addOrganizationImageResolver?.(
      {},
      args,
      context
    );
    const updatedTestOrganization = await Organization.findOne({
      _id: testOrganization!._id,
    }).lean();
    expect(addOrganizationImagePayload).toEqual(updatedTestOrganization);
    expect(addOrganizationImagePayload?.image).toEqual(testImagePath);
  });
});
