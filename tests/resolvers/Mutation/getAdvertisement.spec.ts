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

describe("resolvers -> Mutation -> getAdvertisement", () => {
  afterEach(() => {
    vi.doUnmock("../../../src/constants");
    vi.resetModules();
    vi.resetAllMocks();
  });

  it(`shouldl return the created ad from the list`, async () => {
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

    //creating a advertisement
    const { createAdvertisement: createAdvertisementResolver } = await import(
      "../../../src/resolvers/Mutation/createAdvertisement"
    );
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
      const lastIndex = getAdvertisementPayload.length - 1;
      expect(getAdvertisementPayload[lastIndex]).toHaveProperty("name", "myad");

      expect(getAdvertisementPayload[lastIndex]).toHaveProperty(
        "mediaUrl",
        "data:image/png;base64,bWVkaWEgY29udGVudA=="
      );

      expect(getAdvertisementPayload[lastIndex]).toHaveProperty(
        "type",
        "POPUP"
      );
    }
  });
});
