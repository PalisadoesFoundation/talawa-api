import { describe, expect, it } from "vitest";
import { getWhere } from "../../../../src/resolvers/Query/helperFunctions/getWhere";
import type {
  ActionItemWhereInput,
  DonationWhereInput,
  EventWhereInput,
  FundWhereInput,
  OrganizationWhereInput,
  PostWhereInput,
  UserWhereInput,
  VenueWhereInput,
  CampaignWhereInput,
  EventVolunteerGroupWhereInput,
  PledgeWhereInput,
  ActionItemCategoryWhereInput,
} from "../../../../src/types/generatedGraphQLTypes";

describe("getWhere function", () => {
  const testCases: [
    string,
    Partial<
      EventWhereInput &
        EventVolunteerGroupWhereInput &
        OrganizationWhereInput &
        PostWhereInput &
        UserWhereInput &
        DonationWhereInput &
        ActionItemWhereInput &
        ActionItemCategoryWhereInput &
        FundWhereInput &
        CampaignWhereInput &
        VenueWhereInput &
        PledgeWhereInput
    >,
    Record<string, unknown>,
  ][] = [
    ["id", { id: "6f6fcd" }, { _id: "6f6fcd" }],
    ["id_not", { id_not: "6f6cd" }, { _id: { $ne: "6f6cd" } }],
    [
      "id_in",
      { id_in: ["6f6cd", "6e4fd"] },
      { _id: { $in: ["6f6cd", "6e4fd"] } },
    ],
    [
      "id_not_in",
      { id_not_in: ["6f6cd", "6e4fd"] },
      { _id: { $nin: ["6f6cd", "6e4fd"] } },
    ],
    ["title", { title: "test title" }, { title: "test title" }],
    [
      "title_not",
      { title_not: "test title" },
      { title: { $ne: "test title" } },
    ],
    [
      "title_in",
      { title_in: ["title 1", "title 2"] },
      { title: { $in: ["title 1", "title 2"] } },
    ],
    [
      "title_not_in",
      { title_not_in: ["title 1", "title 2"] },
      { title: { $nin: ["title 1", "title 2"] } },
    ],
    [
      "title_contains",
      { title_contains: "test" },
      { title: { $regex: "test", $options: "i" } },
    ],
    ["title_starts_with", { title_starts_with: "test" }, { title: /^test/ }],
    [
      "description",
      { description: "test description" },
      { description: "test description" },
    ],
    [
      "description_not",
      { description_not: "test description" },
      { description: { $ne: "test description" } },
    ],
    [
      "description_in",
      { description_in: ["desc 1", "desc 2"] },
      { description: { $in: ["desc 1", "desc 2"] } },
    ],
    [
      "description_not_in",
      { description_not_in: ["desc 1", "desc 2"] },
      { description: { $nin: ["desc 1", "desc 2"] } },
    ],
    [
      "description_contains",
      { description_contains: "test" },
      { description: { $regex: "test", $options: "i" } },
    ],
    [
      "description_starts_with",
      { description_starts_with: "test" },
      { description: /^test/ },
    ],
    [
      "organization_id",
      { organization_id: "65fed" },
      { organization: "65fed" },
    ],
    [
      "actionItemCategory_id",
      { actionItemCategory_id: "6f43d" },
      { actionItemCategoryId: "6f43d" },
    ],
    ["is_completed", { is_completed: true }, { isCompleted: true }],
    ["is_completed", { is_completed: false }, { isCompleted: false }],
    ["event_id", { event_id: "6f43d" }, { eventId: "6f43d" }],
    ["eventId", { eventId: "6f43d" }, { eventId: "6f43d" }],
    ["location", { location: "test location" }, { location: "test location" }],
    [
      "location_not",
      { location_not: "test location" },
      { location: { $ne: "test location" } },
    ],
    [
      "location_in",
      { location_in: ["loc 1", "loc 2"] },
      { location: { $in: ["loc 1", "loc 2"] } },
    ],
    [
      "location_not_in",
      { location_not_in: ["loc 1", "loc 2"] },
      { location: { $nin: ["loc 1", "loc 2"] } },
    ],
    [
      "location_contains",
      { location_contains: "test" },
      { location: { $regex: "test", $options: "i" } },
    ],
    [
      "name_of_user",
      { name_of_user: "Wilt Shephard" },
      { nameOfUser: "Wilt Shephard" },
    ],
    [
      "name_of_user_not",
      { name_of_user_not: "Wilt Shephard" },
      { nameOfUser: { $ne: "Wilt Shephard" } },
    ],
    [
      "name_of_user_in",
      { name_of_user_in: ["Wilt Shephard", "Jane Smith"] },
      { nameOfUser: { $in: ["Wilt Shephard", "Jane Smith"] } },
    ],
    [
      "name_of_user_not_in",
      { name_of_user_not_in: ["Wilt Shephard", "Jane Smith"] },
      { nameOfUser: { $nin: ["Wilt Shephard", "Jane Smith"] } },
    ],
    [
      "name_of_user_contains",
      { name_of_user_contains: "Shephard" },
      { nameOfUser: { $regex: "Shephard", $options: "i" } },
    ],
    [
      "name_of_user_starts_with",
      { name_of_user_starts_with: "Wilt" },
      { nameOfUser: /^Wilt/ },
    ],
    ["name", { name: "Unity Foundation" }, { name: "Unity Foundation" }],
    [
      "name_not",
      { name_not: "Unity Foundation" },
      { name: { $ne: "Unity Foundation" } },
    ],
    [
      "name_in",
      { name_in: ["Org 1", "Org 2"] },
      { name: { $in: ["Org 1", "Org 2"] } },
    ],
    [
      "name_not_in",
      { name_not_in: ["Org 1", "Org 2"] },
      { name: { $nin: ["Org 1", "Org 2"] } },
    ],
    [
      "name_contains",
      { name_contains: "Test" },
      { name: { $regex: "Test", $options: "i" } },
    ],
    ["name_starts_with", { name_starts_with: "Test" }, { name: /^Test/ }],
    [
      "apiUrl",
      { apiUrl: "http://example.com" },
      { apiUrl: "http://example.com" },
    ],
    [
      "apiUrl_not",
      { apiUrl_not: "http://example.com" },
      { apiUrl: { $ne: "http://example.com" } },
    ],
    [
      "apiUrl_in",
      { apiUrl_in: ["http://example.com", "http://example.org"] },
      { apiUrl: { $in: ["http://example.com", "http://example.org"] } },
    ],
    [
      "apiUrl_not_in",
      { apiUrl_not_in: ["http://example.com", "http://example.org"] },
      { apiUrl: { $nin: ["http://example.com", "http://example.org"] } },
    ],
    [
      "apiUrl_contains",
      { apiUrl_contains: "example" },
      { apiUrl: { $regex: "example", $options: "i" } },
    ],
    ["apiUrl_starts_with", { apiUrl_starts_with: "http" }, { apiUrl: /^http/ }],
    ["visibleInSearch", { visibleInSearch: true }, { visibleInSearch: true }],
    [
      "userRegistrationRequired",
      { userRegistrationRequired: true },
      { isPublic: true },
    ],
    ["firstName", { firstName: "Wilt" }, { firstName: "Wilt" }],
    [
      "firstName_not",
      { firstName_not: "Wilt" },
      { firstName: { $ne: "Wilt" } },
    ],
    [
      "firstName_in",
      { firstName_in: ["Wilt", "Jane"] },
      { firstName: { $in: ["Wilt", "Jane"] } },
    ],
    [
      "firstName_not_in",
      { firstName_not_in: ["Wilt", "Jane"] },
      { firstName: { $nin: ["Wilt", "Jane"] } },
    ],
    [
      "firstName_contains",
      { firstName_contains: "oh" },
      { firstName: { $regex: "oh", $options: "i" } },
    ],
    [
      "firstName_starts_with",
      { firstName_starts_with: "Wilt" },
      { firstName: /^Wilt/ },
    ],
    ["lastName", { lastName: "Shephard" }, { lastName: "Shephard" }],
    [
      "lastName_not",
      { lastName_not: "Shephard" },
      { lastName: { $ne: "Shephard" } },
    ],
    [
      "lastName_in",
      { lastName_in: ["Shephard", "Smith"] },
      { lastName: { $in: ["Shephard", "Smith"] } },
    ],
    [
      "lastName_not_in",
      { lastName_not_in: ["Shephard", "Smith"] },
      { lastName: { $nin: ["Shephard", "Smith"] } },
    ],
    [
      "lastName_contains",
      { lastName_contains: "oe" },
      { lastName: { $regex: "oe", $options: "i" } },
    ],
    [
      "lastName_starts_with",
      { lastName_starts_with: "Do" },
      { lastName: /^Do/ },
    ],
    [
      "email",
      { email: "testsuperadmin@example.com" },
      { email: "testsuperadmin@example.com" },
    ],
    [
      "email_not",
      { email_not: "testsuperadmin@example.com" },
      { email: { $ne: "testsuperadmin@example.com" } },
    ],
    [
      "email_in",
      { email_in: ["testsuperadmin@example.com", "jane@example.com"] },
      { email: { $in: ["testsuperadmin@example.com", "jane@example.com"] } },
    ],
    [
      "email_not_in",
      { email_not_in: ["testsuperadmin@example.com", "jane@example.com"] },
      { email: { $nin: ["testsuperadmin@example.com", "jane@example.com"] } },
    ],
    [
      "email_contains",
      { email_contains: "@example" },
      { email: { $regex: "@example", $options: "i" } },
    ],
    [
      "email_starts_with",
      { email_starts_with: "testsuperadmin" },
      { email: /^testsuperadmin/ },
    ],
    [
      "event_title_contains",
      { event_title_contains: "event" },
      { "registeredEvents.title": { $regex: "event", $options: "i" } },
    ],
    ["text", { text: "sample text" }, { text: "sample text" }],
    ["text_not", { text_not: "sample text" }, { text: { $ne: "sample text" } }],
    [
      "text_in",
      { text_in: ["text 1", "text 2"] },
      { text: { $in: ["text 1", "text 2"] } },
    ],
    [
      "text_not_in",
      { text_not_in: ["text 1", "text 2"] },
      { text: { $nin: ["text 1", "text 2"] } },
    ],
    [
      "text_contains",
      { text_contains: "sample" },
      { text: { $regex: "sample", $options: "i" } },
    ],
    ["text_starts_with", { text_starts_with: "sample" }, { text: /^sample/ }],
    ["name_starts_with", { name_starts_with: "Test" }, { name: /^Test/ }],
    [
      "name_contains",
      { name_contains: "Test" },
      { name: { $regex: "Test", $options: "i" } },
    ],
    ["fundId", { fundId: "6f6c" }, { fundId: "6f6c" }],
    [
      "organizationId",
      { organizationId: "6f6cd" },
      { organizationId: "6f6cd" },
    ],
    ["campaignId", { campaignId: "6f6c" }, { _id: "6f6c" }],
    [
      "volunteerId",
      { volunteerId: "6f43d" },
      {
        volunteers: {
          $in: ["6f43d"],
        },
      },
    ],
    ["is_disabled", { is_disabled: true }, { isDisabled: true }],
    ["is_disabled", { is_disabled: false }, { isDisabled: false }],
  ];

  it.each(testCases)(
    "should return correct where payload for %s",
    (_name, input, expected) => {
      const result = getWhere(input);
      expect(result).toEqual(expected);
    },
  );

  it("should return empty object when input is undefined", () => {
    const result = getWhere(undefined);
    expect(result).toEqual({});
  });
});
