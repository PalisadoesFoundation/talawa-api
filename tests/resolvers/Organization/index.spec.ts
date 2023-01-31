import { Organization } from "../../../src/resolvers/Organization/index";
import { admins } from "../../../src/resolvers/Organization/admins";
import { blockedUsers } from "../../../src/resolvers/Organization/blockedUsers";
import { creator } from "../../../src/resolvers/Organization/creator";
import { members } from "../../../src/resolvers/Organization/members";
import { membershipRequests } from "../../../src/resolvers/Organization/membershipRequests";
import { OrganizationResolvers } from "../../../src/types/generatedGraphQLTypes";
import { describe, it, expect, beforeAll } from "vitest";

let testOrganization: OrganizationResolvers;

beforeAll(() => {
  testOrganization = {
    admins,
    blockedUsers,
    creator,
    members,
    membershipRequests,
  };
});

describe("resolvers -> Organization -> index", () => {
  it("creates the Orgainzation", () => {
    expect(Organization).toStrictEqual(testOrganization);
  });
});
