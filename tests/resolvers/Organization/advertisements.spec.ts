import { GraphQLError } from "graphql";
import type mongoose from "mongoose";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Advertisement, type InterfaceOrganization } from "../../../src/models";
import {
  advertisements as AdvertisementResolvers,
  parseCursor,
} from "../../../src/resolvers/Organization/advertisements";
import { connect, disconnect } from "../../helpers/db";
import { type TestAdvertisementType } from "../../helpers/advertisement";
import { createTestUserAndOrganization } from "../../helpers/userAndOrg";
import type {
  TestUserType,
  TestOrganizationType,
} from "../../helpers/userAndOrg";
import type { DefaultGraphQLArgumentError } from "../../../src/utilities/graphQLConnection";
import { Types } from "mongoose";

let MONGOOSE_INSTANCE: typeof mongoose;
let testAdvertisement1: TestAdvertisementType;
let testAdvertisement2: TestAdvertisementType;
let testOrganization: TestOrganizationType;
let testUserAndOrganization;
let testUser: TestUserType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  testUserAndOrganization = await createTestUserAndOrganization();
  testOrganization = testUserAndOrganization[1];
  testUser = testUserAndOrganization[0];
  const advertisement1 = await Advertisement.create({
    name: "Test Advertisement",
    mediaUrl: "data:image/png;base64,bWVkaWEgY29udG",
    type: "POPUP",
    startDate: "2023-01-01",
    endDate: "2023-01-31",
    organizationId: testOrganization?._id,
    createdAt: "2024-01-13T18:23:00.316Z",
    updatedAt: "2024-01-13T20:28:21.292Z",
    creatorId: testUser?._id,
  });
  const advertisement2 = await Advertisement.create({
    name: "Test Advertisement2",
    mediaUrl: "data:image/png;base64,bWVkaWEgY29udG",
    type: "POPUP",
    startDate: "2023-01-01",
    endDate: "2023-01-31",
    organizationId: testOrganization?._id,
    createdAt: "2024-01-13T18:23:00.316Z",
    updatedAt: "2024-01-13T20:28:21.292Z",
    creatorId: testUser?._id,
  });
  testAdvertisement1 = advertisement1.toObject();
  testAdvertisement2 = advertisement2.toObject();
});

afterAll(async () => {
  // Clean up after the tests
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Organization -> Advertisement", () => {
  it(`throws GraphQLError if invalid arguments are provided to the resolver`, async () => {
    try {
      const parent = testOrganization?.toObject() as InterfaceOrganization;
      await AdvertisementResolvers?.(parent, {}, {});
    } catch (error) {
      if (error instanceof GraphQLError) {
        expect(error.extensions.code).toEqual("INVALID_ARGUMENTS");
        expect(
          (error.extensions.errors as DefaultGraphQLArgumentError[]).length,
        ).toBeGreaterThan(0);
      }
    }
  });
  it(`returns the expected connection object`, async () => {
    const parent = testOrganization?.toObject() as InterfaceOrganization;
    const totalCount = await Advertisement.find({
      organizationId: testOrganization?._id,
    }).countDocuments();

    const connection = await AdvertisementResolvers?.(
      parent,
      {
        first: 2,
      },
      {},
    );
    const context = { apiRootUrl: undefined };

    expect(connection).toEqual({
      edges: [
        {
          cursor: testAdvertisement2?._id.toString(),
          node: {
            ...testAdvertisement2,
            _id: testAdvertisement2?._id.toString(),
            mediaUrl: `${context.apiRootUrl}${testAdvertisement2.mediaUrl}`,
          },
        },
        {
          cursor: testAdvertisement1?._id.toString(),
          node: {
            ...testAdvertisement1,
            _id: testAdvertisement1?._id.toString(),
            mediaUrl: `${context.apiRootUrl}${testAdvertisement1.mediaUrl}`,
          },
        },
      ],
      pageInfo: {
        endCursor: testAdvertisement1?._id.toString(),
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: testAdvertisement2?._id.toString(),
      },
      totalCount,
    });
  });
});
describe("parseCursor function", () => {
  it("returns failure state if argument cursorValue is an invalid cursor", async () => {
    const result = await parseCursor({
      cursorName: "after",
      cursorPath: ["after"],
      cursorValue: new Types.ObjectId().toString(),
      organizationId: testOrganization?._id.toString() as string,
    });

    expect(result.isSuccessful).toEqual(false);
    if (result.isSuccessful === false) {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });

  it("returns success state if argument cursorValue is a valid cursor", async () => {
    const result = await parseCursor({
      cursorName: "after",
      cursorPath: ["after"],
      cursorValue: testAdvertisement1?._id.toString() as string,
      organizationId: testOrganization?._id.toString() as string,
    });

    expect(result.isSuccessful).toEqual(true);
    if (result.isSuccessful === true) {
      expect(result.parsedCursor).toEqual(testAdvertisement1?._id.toString());
    }
  });
});
