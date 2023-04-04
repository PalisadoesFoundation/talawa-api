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
import { MEMBERSHIP_REQUEST_NOT_FOUND_ERROR } from "../../../src/constants";
import {
  createTestMembershipRequest,
  TestMembershipRequestType,
} from "../../helpers/membershipRequests";

let testMembershipRequest: TestMembershipRequestType;
let MONGOOSE_INSTANCE: typeof mongoose | null;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const userOrgMembershipRequest = await createTestMembershipRequest();
  testMembershipRequest = userOrgMembershipRequest[2];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE!);
});

describe("utilities -> getValidMembershipRequestById", () => {
  afterEach(() => {
    vi.resetModules();
  });

  it("throws error if no membership request exits with the given id", async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    const randomTestObejctId = new Types.ObjectId();

    try {
      const { getValidMembershipRequestById } = await import(
        "../../../src/utilities"
      );

      await getValidMembershipRequestById(randomTestObejctId);
    } catch (error: any) {
      expect(error.message).toEqual(
        `Translated ${MEMBERSHIP_REQUEST_NOT_FOUND_ERROR.MESSAGE}`
      );
    }

    expect(spy).toBeCalledWith(MEMBERSHIP_REQUEST_NOT_FOUND_ERROR.MESSAGE);
  });

  it("returns valid MembershipRequest with matching id", async () => {
    const { getValidMembershipRequestById } = await import(
      "../../../src/utilities"
    );
    const membershipRequest = await getValidMembershipRequestById(
      testMembershipRequest?._id
    );

    expect(membershipRequest).toEqual(testMembershipRequest?.toObject());
  });
});
