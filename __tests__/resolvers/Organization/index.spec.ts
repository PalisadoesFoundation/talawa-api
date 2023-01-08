import { Organization } from "../../../src/lib/resolvers/Organization/index";
import { admins } from "../../../src/lib/resolvers/Organization/admins";
import { blockedUsers } from "../../../src/lib/resolvers/Organization/blockedUsers";
import { creator } from "../../../src/lib/resolvers/Organization/creator";
import { members } from "../../../src/lib/resolvers/Organization/members";
import { membershipRequests } from "../../../src/lib/resolvers/Organization/membershipRequests";
import { OrganizationResolvers } from "../../../src/generated/graphqlCodegen";
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
