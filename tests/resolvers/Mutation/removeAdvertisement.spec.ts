import "dotenv/config";
import type mongoose from "mongoose";
import type { MutationCreateAdvertisementArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

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
import {
  createTestUserAndOrganization,
  createTestUser,
} from "../../helpers/userAndOrg";
import { ADVERTISEMENT_NOT_FOUND_ERROR } from "../../../src/constants";

let testUser: TestUserType;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let randomUser: TestUserType;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let testOrganization: TestOrganizationType;
let MONGOOSE_INSTANCE: typeof mongoose;

vi.mock("../../utilities/uploadEncodedImage", () => ({
  uploadEncodedImage: vi.fn(),
}));

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const temp = await createTestUserAndOrganization();
  testUser = temp[0];
  testOrganization = temp[1];
  randomUser = await createTestUser();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> removeAdvertisement", () => {
  afterEach(() => {
    vi.doUnmock("../../../src/constants");
    vi.resetModules();
    vi.resetAllMocks();
  });

  it(`creates the ad and then deleting the ad`, async () => {
    const args: MutationCreateAdvertisementArgs = {
      input: {
        name: "myad",
        organizationId: "64d1f8cb77a4b61004f824b8",
        type: "POPUP",
        file: "data:image/png;base64,bWVkaWEgY29udGVudA==",
        startDate: "2023-10-08T13:02:29.000Z",
        endDate: "2023-10-08T13:02:29.000Z",
      },
    };

    const context = {
      userId: testUser?.id,
    };

    const { createAdvertisement: createAdvertisementResolver } = await import(
      "../../../src/resolvers/Mutation/createAdvertisement"
    );

    const createdAdvertisementPayload = await createAdvertisementResolver?.(
      {},
      args,
      context
    );
    const createdAdvertisementId = createdAdvertisementPayload?._id || "";

    // deleting the ad
    const { removeAdvertisement } = await import(
      "../../../src/resolvers/Mutation/removeAdvertisement"
    );

    const removeAdvertisementPayload = await removeAdvertisement?.(
      {},
      { id: createdAdvertisementId },
      context
    );

    expect(removeAdvertisementPayload).toHaveProperty(
      "_id",
      createdAdvertisementId
    );

    expect(removeAdvertisementPayload).toHaveProperty("name", "myad");

    expect(removeAdvertisementPayload).toHaveProperty(
      "mediaUrl",
      "data:image/png;base64,bWVkaWEgY29udGVudA=="
    );

    expect(removeAdvertisementPayload).toHaveProperty("type", "POPUP");
  });
  it("should throw NOT_FOUND_ERROR on wrong advertisement", async () => {
    // deleting
    const { removeAdvertisement } = await import(
      "../../../src/resolvers/Mutation/removeAdvertisement"
    );
    const context = {
      userId: testUser?.id,
    };
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message: string) => `Translated ${message}`);

    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const removeAdvertisementPayload = await removeAdvertisement?.(
        {},
        { id: "64d1f8cb77a4b51004f824b8" },
        context
      );
    } catch (error: any) {
      expect(spy).toBeCalledWith(ADVERTISEMENT_NOT_FOUND_ERROR.MESSAGE);
      expect(error.message).toEqual(
        `Translated ${ADVERTISEMENT_NOT_FOUND_ERROR.MESSAGE}`
      );
    }
  });
});
