import "dotenv/config";
import mongoose from "mongoose";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { Organization } from "../../../src/models";
import { organization as organizationResolver } from "../../../src/resolvers/MembershipRequest/organization";
import { connect, disconnect } from "../../helpers/db";
import type { TestMembershipRequestType } from "../../helpers/membershipRequests";
import { createTestMembershipRequest } from "../../helpers/membershipRequests";
import { ORGANIZATION_NOT_FOUND_ERROR } from "../../../src/constants";

let testMembershipRequest: TestMembershipRequestType;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const temp = await createTestMembershipRequest();
  testMembershipRequest = temp[2];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> MembershipRequest -> organization", () => {
  it(`returns organization object for parent.organization`, async () => {
    const parent = testMembershipRequest?.toObject();
    if (!parent) {
      throw new Error("Parent object is undefined.");
    }
    const organizationPayload = await organizationResolver?.(parent, {}, {});

    const organization = await Organization.findOne({
      _id: testMembershipRequest?.organization,
    }).lean();

    expect(organizationPayload).toEqual(organization);
  });
  it(`throws NotFoundError if no organization exists`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);

    const parent = {
      ...testMembershipRequest?.toObject(),
      organization: new mongoose.Types.ObjectId(), // Set to a non-existing ObjectId
    };

    if (!parent) {
      throw new Error("Parent object is undefined.");
    }

    try {
      if (organizationResolver) {
        // @ts-expect-error - Testing for error
        await organizationResolver(parent, {}, {});
      }
    } catch (error: unknown) {
      expect(spy).toBeCalledWith(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        ORGANIZATION_NOT_FOUND_ERROR.MESSAGE,
      );
    }
  });
});
