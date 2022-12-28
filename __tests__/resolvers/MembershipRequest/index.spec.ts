import { MembershipRequest } from "../../../src/lib/resolvers/MembershipRequest/index";
import { MembershipRequestResolvers } from "../../../src/generated/graphqlCodegen";
import { organization } from "../../../src/lib/resolvers/MembershipRequest/organization";
import { user } from "../../../src/lib/resolvers/MembershipRequest/user";
import { describe, it, beforeAll, expect } from "vitest";

let testMembershipRequest: MembershipRequestResolvers;

beforeAll(() => {
  testMembershipRequest = {
    organization,
    user,
  };
});

describe("resolvers -> MembershipRequest -> index", () => {
  it("creates the MembershipRequest", () => {
    expect(MembershipRequest).toStrictEqual(testMembershipRequest);
  });
});
