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

let testUser: TestUserType;
let randomUser: TestUserType;
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

describe("resolvers -> Mutation -> getAdvertisement", () => {
  afterEach(() => {
    vi.doUnmock("../../../src/constants");
    vi.resetModules();
    vi.resetAllMocks();
  });

  it(`creates the post and returns it when image is not provided`, async () => {
    const args: MutationCreateAdvertisementArgs = {
      name: "myad",
      orgId: "64d1f8cb77a4b61004f824b8",
      type: "POPUP",
      link: "https://www.example.com",
      startDate: "2023-10-08T13:02:29.000Z",
      endDate: "2023-10-08T13:02:29.000Z",
    };

    const context = {
      userId: testUser?.id,
    };

    //creating a advertisement
    const { createAdvertisement: createAdvertisementResolver } = await import(
      "../../../src/resolvers/Mutation/createAdvertisement"
    );

    const createdAdvertisementPayload = await createAdvertisementResolver?.(
      {},
      args,
      context
    );

    const { getAdvertisements: getAdvertisementResolver } = await import(
      "../../../src/resolvers/Query/getAdvertisements"
    );
    const getAdvertisementPayload = await getAdvertisementResolver?.(
      {},
      args,
      context
    );
    if (getAdvertisementPayload) {
      expect(getAdvertisementPayload[0]).toHaveProperty("name", "myad");

      expect(getAdvertisementPayload[0]).toHaveProperty(
        "link",
        "https://www.example.com"
      );

      expect(getAdvertisementPayload[0]).toHaveProperty("type", "POPUP");
    }
  });
});
