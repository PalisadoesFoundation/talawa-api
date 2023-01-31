import { MembershipRequest } from "../../../src/resolvers/MembershipRequest/index";
import { MembershipRequestResolvers } from "../../../src/types/generatedGraphQLTypes";
import { organization } from "../../../src/resolvers/MembershipRequest/organization";
import { user } from "../../../src/resolvers/MembershipRequest/user";
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
