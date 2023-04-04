import {
  createTestUserAndOrganization,
  TestOrganizationType,
} from "../../helpers/userAndOrg";
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
import { ORGANIZATION_NOT_FOUND_ERROR } from "../../../src/constants";

let testOrganization: TestOrganizationType;
let MONGOOSE_INSTANCE: typeof mongoose | null;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [, testOrganization] = await createTestUserAndOrganization();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE!);
});

describe("utilities -> validateOrganizationById", () => {
  afterEach(() => {
    vi.resetModules();
  });

  it("throws error if no organization exits with the given id", async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    const randomTestObejctId = new Types.ObjectId();

    try {
      const { validateOrganizationById } = await import(
        "../../../src/utilities"
      );

      await validateOrganizationById(randomTestObejctId);
    } catch (error: any) {
      expect(error.message).toEqual(
        `Translated ${ORGANIZATION_NOT_FOUND_ERROR.MESSAGE}`
      );
    }

    expect(spy).toBeCalledWith(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE);
  });

  it("throws no error if organization exits with the given id", async () => {
    const { validateOrganizationById } = await import("../../../src/utilities");

    await expect(
      validateOrganizationById(testOrganization?._id)
    ).resolves.not.toThrowError();
  });
});
