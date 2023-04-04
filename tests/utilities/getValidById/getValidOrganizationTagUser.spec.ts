import mongoose, { Types } from "mongoose";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { connect, disconnect } from "../../helpers/db";
import { TAG_NOT_FOUND } from "../../../src/constants";
import { createRootTagWithOrg, TestUserTagType } from "../../helpers/tags";

let testOrganizationTagUser: TestUserTagType;
let MONGOOSE_INSTANCE: typeof mongoose | null;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const userOrgTag = await createRootTagWithOrg();
  testOrganizationTagUser = userOrgTag[2];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE!);
});

describe("utilities -> getValidOrganizationTagUserById", () => {
  afterEach(() => {
    vi.resetModules();
  });

  it("throws error if no tag exits with the given id", async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    const randomTestObejctId = new Types.ObjectId();

    try {
      const { getValidOrganizationTagUserById } = await import("../../../src/utilities");

      await getValidOrganizationTagUserById(randomTestObejctId);
    } catch (error: any) {
      expect(error.message).toEqual(
        `Translated ${TAG_NOT_FOUND.MESSAGE}`
      );
    }

    expect(spy).toBeCalledWith(TAG_NOT_FOUND.MESSAGE);
  });

  it("returns valid OrganizationUserTag with matching id", async () => {
    const { getValidOrganizationTagUserById } = await import("../../../src/utilities");
    const organizationTagUser = await getValidOrganizationTagUserById(testOrganizationTagUser?._id!);

    expect(organizationTagUser).toEqual(testOrganizationTagUser);
  });
});
