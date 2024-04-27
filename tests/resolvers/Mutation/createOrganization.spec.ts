import "dotenv/config";
import type mongoose from "mongoose";
import { ActionItemCategory, AppUserProfile, User } from "../../../src/models";
import type { MutationCreateOrganizationArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  LENGTH_VALIDATION_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_AUTHORIZED_SUPERADMIN,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { createOrganization as createOrganizationResolver } from "../../../src/resolvers/Mutation/createOrganization";
import * as uploadEncodedImage from "../../../src/utilities/encodedImageStorage/uploadEncodedImage";
import * as uploadImage from "../../../src/utilities/uploadImage";
import type { TestUserType } from "../../helpers/user";
import { createTestUserFunc } from "../../helpers/user";
import { Types } from "mongoose";

let testUser: TestUserType;
let MONGOOSE_INSTANCE: typeof mongoose;

vi.mock("../../utilities/uploadEncodedImage", () => ({
  uploadEncodedImage: vi.fn(),
}));

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  testUser = await createTestUserFunc();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> createOrganization", () => {
  afterEach(() => {
    vi.doUnmock("../../../src/constants");
    vi.resetModules();
  });

  it(`throws Not Authorised Error if user is not a super admin`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => message);
    try {
      const args: MutationCreateOrganizationArgs = {
        data: {
          description: "description",
          name: "name",
          userRegistrationRequired: true,
          visibleInSearch: true,
          apiUrl: "apiUrl",
          address: {
            city: "CityName",
            countryCode: "US",
            dependentLocality: "Dependent Locality",
            line1: "123 Main Street",
            line2: "Apartment 456",
            postalCode: "12345",
            sortingCode: "ABC-123",
            state: "State/Province",
          },
        },
      };

      const context = {
        userId: testUser?.id,
      };

      const { createOrganization } = await import(
        "../../../src/resolvers/Mutation/createOrganization"
      );
      await createOrganization?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toHaveBeenLastCalledWith(
        USER_NOT_AUTHORIZED_SUPERADMIN.MESSAGE,
      );
      expect((error as Error).message).toEqual(
        USER_NOT_AUTHORIZED_SUPERADMIN.MESSAGE,
      );
    }
  });

  it(`creates the organization with image and returns it`, async () => {
    // vi.spyOn(uploadImage, "uploadImage").mockImplementation(
    //   async (newImagePath: any, imageAlreadyInDbPath: any) => ({
    //     newImagePath,
    //     imageAlreadyInDbPath,
    //   })
    // );

    vi.spyOn(uploadEncodedImage, "uploadEncodedImage").mockImplementation(
      async (encodedImageURL: string) => encodedImageURL,
    );
    await AppUserProfile.updateOne(
      {
        userId: testUser?._id,
      },
      {
        $set: {
          isSuperAdmin: true,
        },
      },
    );

    const args: MutationCreateOrganizationArgs = {
      data: {
        description: "description",
        name: "name",
        apiUrl: "apiUrl",
        address: {
          city: "CityName",
          countryCode: "US",
          dependentLocality: "Dependent Locality",
          line1: "123 Main Street",
          line2: "Apartment 456",
          postalCode: "12345",
          sortingCode: "ABC-123",
          state: "State/Province",
        },
        userRegistrationRequired: true,
        visibleInSearch: true,
      },
      file: "imagePath",
    };
    const context = {
      userId: testUser?._id,
    };

    const createOrganizationPayload = await createOrganizationResolver?.(
      {},
      args,
      context,
    );
    expect(createOrganizationPayload).toEqual(
      expect.objectContaining({
        description: "description",
        name: "name",
        apiUrl: "apiUrl",
        address: {
          city: "CityName",
          countryCode: "US",
          dependentLocality: "Dependent Locality",
          line1: "123 Main Street",
          line2: "Apartment 456",
          postalCode: "12345",
          sortingCode: "ABC-123",
          state: "State/Province",
        },
        userRegistrationRequired: true,
        visibleInSearch: true,
        creatorId: testUser?._id,
        admins: [testUser?._id],
        members: [testUser?._id],
        image: "imagePath",
      }),
    );
    expect(createOrganizationPayload?.image).toEqual("imagePath");

    const updatedTestUser = await User.findOne({
      _id: testUser?._id,
    })
      .select(["joinedOrganizations"])
      .lean();
    const updatedTestAppUser = await AppUserProfile.findOne({
      userId: testUser?._id,
    })
      .select(["createdOrganizations", "adminFor"])
      .lean();

    expect(updatedTestAppUser).toEqual(
      expect.objectContaining({
        createdOrganizations: [createOrganizationPayload?._id],
        adminFor: [createOrganizationPayload?._id],
      }),
    );
    expect(updatedTestUser?.joinedOrganizations).toContainEqual(
      createOrganizationPayload?._id,
    );

    const defaultCategory = await ActionItemCategory.findOne({
      organizationId: createOrganizationPayload?._id,
    }).lean();

    expect(defaultCategory).toEqual(
      expect.objectContaining({
        organizationId: createOrganizationPayload?._id,
        name: "Default",
        isDisabled: false,
      }),
    );
  });
  it(`creates the organization without image and returns it`, async () => {
    vi.spyOn(uploadImage, "uploadImage").mockImplementation(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async (newImagePath: any, imageAlreadyInDbPath: any) => ({
        newImagePath,
        imageAlreadyInDbPath,
      }),
    );
    const args: MutationCreateOrganizationArgs = {
      data: {
        description: "description",
        name: "name",
        userRegistrationRequired: true,
        visibleInSearch: true,
        apiUrl: "apiUrl",
        address: {
          city: "CityName",
          countryCode: "US",
          dependentLocality: "Dependent Locality",
          line1: "123 Main Street",
          line2: "Apartment 456",
          postalCode: "12345",
          sortingCode: "ABC-123",
          state: "State/Province",
        },
      },
      file: null,
    };
    const context = {
      userId: testUser?._id,
    };

    const createOrganizationPayload = await createOrganizationResolver?.(
      {},
      args,
      context,
    );
    expect(createOrganizationPayload).toEqual(
      expect.objectContaining({
        description: "description",
        name: "name",
        userRegistrationRequired: true,
        visibleInSearch: true,
        apiUrl: "apiUrl",
        address: {
          city: "CityName",
          countryCode: "US",
          dependentLocality: "Dependent Locality",
          line1: "123 Main Street",
          line2: "Apartment 456",
          postalCode: "12345",
          sortingCode: "ABC-123",
          state: "State/Province",
        },
        creatorId: testUser?._id,
        admins: [testUser?._id],
        members: [testUser?._id],
      }),
    );
    expect(createOrganizationPayload?.image).toBe(null);
  });

  it(`throws String Length Validation error if name is greater than 256 characters`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementation(
      (message) => message,
    );
    try {
      const args: MutationCreateOrganizationArgs = {
        data: {
          description: "description",
          userRegistrationRequired: true,
          visibleInSearch: true,
          name: "JWQPfpdkGGGKyryb86K4YN85nDj4m4F7gEAMBbMXLax73pn2okV6kpWY0EYO0XSlUc0fAlp45UCgg3s6mqsRYF9FOlzNIDFLZ1rd03Z17cdJRuvBcAmbC0imyqGdXHGDUQmVyOjDkaOLAvjhB5uDeuEqajcAPTcKpZ6LMpigXuqRAd0xGdPNXyITC03FEeKZAjjJL35cSIUeMv5eWmiFlmmm70FU1Bp6575zzBtEdyWPLflcA2GpGmmf4zvT7nfgN3NIkwQIhk9OwP8dn75YYczcYuUzLpxBu1Lyog77YlAj5DNdTIveXu9zHeC6V4EEUcPQtf1622mhdU3jZNMIAyxcAG4ErtztYYRqFs0ApUxXiQI38rmiaLcicYQgcOxpmFvqRGiSduiCprCYm90CHWbQFq4w2uhr8HhR3r9HYMIYtrRyO6C3rPXaQ7otpjuNgE0AKI57AZ4nGG1lvNwptFCY60JEndSLX9Za6XP1zkVRLaMZArQNl",
          apiUrl: "apiUrl",
          address: {
            city: "CityName",
            countryCode: "US",
            dependentLocality: "Dependent Locality",
            line1: "123 Main Street",
            line2: "Apartment 456",
            postalCode: "12345",
            sortingCode: "ABC-123",
            state: "State/Province",
          },
        },
        file: null,
      };
      const context = {
        userId: testUser?._id,
      };

      await createOrganizationResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        `${LENGTH_VALIDATION_ERROR.MESSAGE} 256 characters in name`,
      );
    }
  });
  it(`throws String Length Validation error if description is greater than 500 characters`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementation(
      (message) => message,
    );
    try {
      const args: MutationCreateOrganizationArgs = {
        data: {
          description:
            "JWQPfpdkGGGKyryb86K4YN85nDj4m4F7gEAMBbMXLax73pn2okV6kpWY0EYO0XSlUc0fAlp45UCgg3s6mqsRYF9FOlzNIDFLZ1rd03Z17cdJRuvBcAmbC0imyqGdXHGDUQmVyOjDkaOLAvjhB5uDeuEqajcAPTcKpZ6LMpigXuqRAd0xGdPNXyITC03FEeKZAjjJL35cSIUeMv5eWmiFlmmm70FU1Bp6575zzBtEdyWPLflcA2GpGmmf4zvT7nfgN3NIkwQIhk9OwP8dn75YYczcYuUzLpxBu1Lyog77YlAj5DNdTIveXu9zHeC6V4EEUcPQtf1622mhdU3jZNMIAyxcAG4ErtztYYRqFs0ApUxXiQI38rmiaLcicYQgcOxpmFvqRGiSduiCprCYm90CHWbQFq4w2uhr8HhR3r9HYMIYtrRyO6C3rPXaQ7otpjuNgE0AKI57AZ4nGG1lvNwptFCY60JEndSLX9Za6XP1zkVRLaMZArQNl",
          name: "random",
          userRegistrationRequired: true,
          visibleInSearch: true,
          apiUrl: "apiUrl",
          address: {
            city: "CityName",
            countryCode: "US",
            dependentLocality: "Dependent Locality",
            line1: "123 Main Street",
            line2: "Apartment 456",
            postalCode: "12345",
            sortingCode: "ABC-123",
            state: "State/Province",
          },
        },
        file: null,
      };
      const context = {
        userId: testUser?._id,
      };

      await createOrganizationResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        `${LENGTH_VALIDATION_ERROR.MESSAGE} 500 characters in description`,
      );
    }
  });
  it("throws Address Validation Error for an invalid address", async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementation(
      (message) => message,
    );

    const invalidAddress = {
      // Constructing an invalid address.
      city: "", // An empty city field
      countryCode: "USA", // Invalid country code format
      dependentLocality: "Manhattan",
      line1: "123 Main Street",
      line2: "Apt 2B",
      postalCode: "InvalidPostalCode", // Invalid postal code format
      sortingCode: "ABC123",
      state: "New York",
    };

    const validAddress = {
      city: "New York",
      countryCode: "US",
      dependentLocality: "Manhattan",
      line1: "123 Main Street",
      line2: "Apt 2B",
      postalCode: "10001",
      sortingCode: "ABC123",
      state: "NY",
    };

    const invalidArgs: MutationCreateOrganizationArgs = {
      data: {
        description: "Some description",
        name: "Test Organization",
        visibleInSearch: true,
        apiUrl: "https://example.com/api",
        address: invalidAddress,
      },
      file: null,
    };

    const validArgs: MutationCreateOrganizationArgs = {
      data: {
        description: "Some description",
        name: "Test Organization",
        visibleInSearch: true,
        apiUrl: "https://example.com/api",
        address: validAddress,
      },
      file: null,
    };

    const context = {
      userId: testUser?._id,
    };

    if (createOrganizationResolver) {
      // Testing for Invalid address
      try {
        await createOrganizationResolver({}, invalidArgs, context);
      } catch (error: unknown) {
        // Validate that the error message matches the expected Address Validation Error message
        expect((error as Error).message).toEqual("Not a Valid Address");
      }

      //Testing for Valid address
      try {
        await createOrganizationResolver({}, validArgs, context);
      } catch (error: unknown) {
        // Validate that the error message matches the expected Address Validation Error message
        expect((error as Error).message).toEqual("Something went wrong.");
      }
    } else {
      console.error(
        "Error: createOrganizationResolver is undefined in the test suite",
      );
    }
  });
  it("throws Address Validation Error for missing address", async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementation(
      (message) => message,
    );

    const missingAddress = {}; // No address field in the data

    const validArgs: MutationCreateOrganizationArgs = {
      data: {
        description: "Some description",
        name: "Test Organization",
        visibleInSearch: true,
        apiUrl: "https://example.com/api",
        address: missingAddress,
      },
      file: null,
    };

    const context = {
      userId: testUser?._id,
    };

    if (createOrganizationResolver) {
      try {
        await createOrganizationResolver({}, validArgs, context);
      } catch (error: unknown) {
        // Validate that the error message matches the expected Address Validation Error message
        expect((error as Error).message).toEqual("Not a Valid Address");
      }
    } else {
      console.error(
        "Error: createOrganizationResolver is undefined in the test suite",
      );
    }
  });
  it("throws error if no user is found", async () => {
    try {
      const args: MutationCreateOrganizationArgs = {
        data: {
          description: "description",
          name: "name",
          userRegistrationRequired: true,
          visibleInSearch: true,
          apiUrl: "apiUrl",
          address: {
            city: "CityName",
            countryCode: "US",
            dependentLocality: "Dependent Locality",
            line1: "123 Main Street",
            line2: "Apartment 456",
            postalCode: "12345",
            sortingCode: "ABC-123",
            state: "State/Province",
          },
        },
        file: null,
      };

      const context = {
        userId: new Types.ObjectId().toString(),
      };

      await createOrganizationResolver?.({}, args, context);
    } catch (error: unknown) {
      // console.log(error);
      // expect(spy).toHaveBeenCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });
  it("throws error if user does not have appProfile", async () => {
    try {
      const temp = await createTestUserFunc();
      await AppUserProfile.deleteOne({
        userId: temp?._id,
      });
      const args: MutationCreateOrganizationArgs = {
        data: {
          description: "description",
          name: "name",
          userRegistrationRequired: true,
          visibleInSearch: true,
          apiUrl: "apiUrl",
          address: {
            city: "CityName",
            countryCode: "US",
            dependentLocality: "Dependent Locality",
            line1: "123 Main Street",
            line2: "Apartment 456",
            postalCode: "12345",
            sortingCode: "ABC-123",
            state: "State/Province",
          },
        },
        file: null,
      };
      const context = {
        userId: temp?._id,
      };

      await createOrganizationResolver?.({}, args, context);
    } catch (error: unknown) {
      // console.log((error as Error).message);

      expect((error as Error).message).toEqual(
        `${USER_NOT_AUTHORIZED_ERROR.MESSAGE}`,
      );
    }
  });
});
