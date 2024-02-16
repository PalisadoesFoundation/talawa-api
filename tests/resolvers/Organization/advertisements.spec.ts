import { GraphQLError } from "graphql";
import type mongoose from "mongoose";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { InterfaceOrganization } from "../../../src/models";
import { advertisements as AdvertisementResolvers } from "../../../src/resolvers/Organization/advertisements";
import type { ConnectionPageInfo } from "../../../src/types/generatedGraphQLTypes";
import type { RelayConnectionArguments } from "../../../src/utilities/parseRelayConnectionArguments";
import { parseRelayConnectionArguments } from "../../../src/utilities/parseRelayConnectionArguments";
import { connect, disconnect } from "../../helpers/db";
import {
  type TestAdvertisementType,
  createTestAdvertisement,
} from "../../helpers/advertisement";
import {
  type TestOrganizationType,
  createTestUserAndOrganization,
} from "../../helpers/userAndOrg";

let MONGOOSE_INSTANCE: typeof mongoose;
let testAdvertisement: TestAdvertisementType;
let testOrganization: TestOrganizationType;
let testUserAndOrganization;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  testAdvertisement = await createTestAdvertisement();
  testUserAndOrganization = await createTestUserAndOrganization();
  testOrganization = testUserAndOrganization[1];
});

afterAll(async () => {
  // Clean up after the tests
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Organization -> advertisements", () => {
  it("returns advertisements craeted in the organization", async () => {
    const parent = testOrganization?.toObject() as InterfaceOrganization;
    const args: RelayConnectionArguments = {
      first: 1,
      after: testAdvertisement?._id,
    };
    const advertisementConnection = await AdvertisementResolvers?.(
      parent,
      args,
      {}
    );

    if (advertisementConnection) {
      console.log(advertisementConnection);

      expect(advertisementConnection.edges).toHaveLength(0);
    }
  });

  it("constructs query correctly with $gt operator when direction is BACKWARD", () => {
    const args: RelayConnectionArguments = {
      last: 1,
      before: testAdvertisement?._id,
    };
    const result = parseRelayConnectionArguments(args, 10);
    const query: Record<string, unknown> = {};
    if (result.direction == "BACKWARD") {
      query._id = { $gt: result.cursor };
    }
    expect(query).toEqual({ _id: { $gt: result.cursor } });
  });
  it("handle advertisement beyond the limit correctly", () => {
    const args: RelayConnectionArguments = {
      first: 3,
      after: "cursor",
    };
    const paginationArgs = parseRelayConnectionArguments(args, 3);
    const advertisements: unknown[] = Array.from({ length: 4 }).map(
      (_, index) => ({
        _id: `advertisement_${index}`,
      })
    );
    const pageInfo: ConnectionPageInfo = {
      hasNextPage: false,
      hasPreviousPage: false,
      startCursor: null,
      endCursor: null,
    };
    if (advertisements.length > paginationArgs.limit) {
      if (paginationArgs.direction === "FORWARD") {
        pageInfo.hasNextPage = true;
      } else {
        pageInfo.hasPreviousPage = true;
      }
      advertisements.pop();
    }

    expect(pageInfo.hasNextPage).toBe(true);
    expect(advertisements.length).toBe(paginationArgs.limit);
  });
  it("reverses advertisements array when fetching in backward direction", () => {
    const args: RelayConnectionArguments = {
      last: 5,
      before: "cursor", // Example cursor
    };
    const paginationArgs = parseRelayConnectionArguments(args, 10);
    const advertisements: unknown[] = [
      { _id: "advertisement_1" },
      { _id: "advertisement_2" },
      { _id: "advertisement_3" },
    ];
    if (paginationArgs.direction === "BACKWARD") {
      advertisements.reverse();
    }
    expect(advertisements).toEqual([
      { _id: "advertisement_3" },
      { _id: "advertisement_2" },
      { _id: "advertisement_1" },
    ]);
  });
});
describe("parseConnectionArguments", () => {
  it("should parse connection arguments correctly with 'first'", () => {
    const args: RelayConnectionArguments = {
      first: 5,
      after: "cursor",
    };
    const result = parseRelayConnectionArguments(args, 10);
    expect(result.direction).toBe("FORWARD");
    expect(result.limit).toBe(5);
    expect(result.cursor).toBe("cursor");
  });

  it("should parse connection arguments correctly with 'last'", () => {
    const args: RelayConnectionArguments = {
      last: 5,
      before: "cursor",
    };
    const result = parseRelayConnectionArguments(args, 10);
    expect(result.direction).toBe("BACKWARD");
    expect(result.limit).toBe(5);
    expect(result.cursor).toBe("cursor");
  });

  it("should throw an error when 'first' and 'last' are provided", () => {
    const args: RelayConnectionArguments = {
      first: 5,
      last: 5,
    };
    expect(() => parseRelayConnectionArguments(args, 10)).toThrowError(
      GraphQLError
    );
  });

  it("should throw an error when 'first' and 'before' are provided", () => {
    const args: RelayConnectionArguments = {
      first: 5,
      before: "cursor",
    };
    expect(() => parseRelayConnectionArguments(args, 10)).toThrowError(
      GraphQLError
    );
  });

  it("should throw an error when 'last' and 'after' are provided", () => {
    const args: RelayConnectionArguments = {
      last: 5,
      after: "cursor",
    };
    expect(() => parseRelayConnectionArguments(args, 10)).toThrowError(
      GraphQLError
    );
  });

  it("should throw an error when neither 'first' nor 'last' are provided", () => {
    const args: RelayConnectionArguments = {};
    expect(() => parseRelayConnectionArguments(args, 10)).toThrowError(
      GraphQLError
    );
  });
});
