import type mongoose from "mongoose";
import { updateOrganizationTimeout } from "../../../src/resolvers/Mutation/updateOrganizationTimeout";
import { Organization } from "../../../src/models";
import { errors } from "../../../src/libraries";
import { connect, disconnect } from "../../helpers/db";
import { createTestUserWithUserTypeFunc } from "../../helpers/user";
import type { TestUserType } from "../../helpers/user";
import { createTestOrganizationWithAdmin } from "../../helpers/userAndOrg";
import type { TestOrganizationType } from "../../helpers/userAndOrg";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  INVALID_TIMEOUT_RANGE,
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";

let MONGOOSE_INSTANCE: typeof mongoose;

let testOrganization: TestOrganizationType;
let testOrganization2: TestOrganizationType;

let testUser1: TestUserType;
let testUser2: TestUserType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();

  testUser1 = await createTestUserWithUserTypeFunc("ADMIN");
  testUser2 = await createTestUserWithUserTypeFunc("USER");
  if (testUser1)
    testOrganization = await createTestOrganizationWithAdmin(
      testUser1._id,
      true,
      true,
      true
    );

  if (testUser2)
    testOrganization2 = await createTestOrganizationWithAdmin(
      testUser2._id,
      true,
      false,
      true
    );
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> updateOrganizationTimeout", () => {
  it("should throw InputValidationError if organizationId is missing", async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementation(
      (message) => `Translated ${message}`
    );

    const context = { userId: testUser1 ? testUser1._id.toString() : null };
    const args = { timeout: 20, organizationId: "" };

    await expect(
      updateOrganizationTimeout?.({}, args, context)
    ).rejects.toThrow(errors.InputValidationError);
  });

  it("should throw NotFoundError if user does not exist", async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);
    const context = { userId: "6737904485008f171cf29924" };
    const args = { organizationId: testOrganization?._id, timeout: 20 };

    await expect(
      updateOrganizationTimeout?.({}, args, context)
    ).rejects.toThrow(errors.NotFoundError);
    expect(spy).toHaveBeenCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
  });

  it("should throw NotFoundError if organization does not exist", async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);

    const context = { userId: testUser1 ? testUser1._id.toString() : null };
    const args = {
      organizationId: "6737904485008f171cf29924",
      timeout: 20,
    };

    await expect(
      updateOrganizationTimeout?.({}, args, context)
    ).rejects.toThrow(errors.NotFoundError);
    expect(spy).toHaveBeenCalledWith(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE);
  });

  it("should throw ValidationError if timeout is not in valid range", async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);
    try {
      const context = { userId: testUser1 ? testUser1._id.toString() : null };
      const args = {
        organizationId: testOrganization
          ? testOrganization._id.toString()
          : null,
        timeout: 70,
      };

      await expect(
        updateOrganizationTimeout?.({}, args, context)
      ).rejects.toThrow(errors.ValidationError);
    } catch (error: unknown) {
      if (error instanceof Error) {
        expect(spy).toHaveBeenCalledWith(INVALID_TIMEOUT_RANGE.MESSAGE);
        expect(error.message).toEqual(INVALID_TIMEOUT_RANGE.MESSAGE);
      }
    }
  });

  it("should update organization timeout", async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementation(
      (message) => `Translated ${message}`
    );

    const context = { userId: testUser1 ? testUser1._id.toString() : null };
    const args = {
      organizationId: testOrganization ? testOrganization._id.toString() : null,
      timeout: 20,
    };

    if (args.organizationId) {
      await updateOrganizationTimeout?.({}, args, context);

      const updatedOrganization = await Organization.findById(
        args.organizationId
      ).lean();

      if (updatedOrganization) {
        expect(updatedOrganization.timeout).toBe(args.timeout);
      }
    }
  });
});
