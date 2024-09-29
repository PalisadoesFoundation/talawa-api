import { describe, expect, it } from "vitest";
import { getSort } from "../../../../src/resolvers/Query/helperFunctions/getSort";
import type {
  EventOrderByInput,
  OrganizationOrderByInput,
  PledgeOrderByInput,
  PostOrderByInput,
  UserOrderByInput,
  VenueOrderByInput,
  FundOrderByInput,
  CampaignOrderByInput,
} from "../../../../src/types/generatedGraphQLTypes";

describe("getSort function", () => {
  const testCases: [string, Record<string, number>][] = [
    ["id_ASC", { _id: 1 }],
    ["id_DESC", { _id: -1 }],
    ["title_ASC", { title: 1 }],
    ["title_DESC", { title: -1 }],
    ["amount_ASC", { amount: 1 }],
    ["amount_DESC", { amount: -1 }],
    ["description_ASC", { description: 1 }],
    ["description_DESC", { description: -1 }],
    ["startDate_ASC", { startDate: 1 }],
    ["startDate_DESC", { startDate: -1 }],
    ["endDate_ASC", { endDate: 1 }],
    ["endDate_DESC", { endDate: -1 }],
    ["allDay_ASC", { allDay: 1 }],
    ["allDay_DESC", { allDay: -1 }],
    ["startTime_ASC", { startTime: 1 }],
    ["startTime_DESC", { startTime: -1 }],
    ["endTime_ASC", { endTime: 1 }],
    ["endTime_DESC", { endTime: -1 }],
    ["location_ASC", { location: 1 }],
    ["location_DESC", { location: -1 }],
    ["capacity_ASC", { capacity: 1 }],
    ["capacity_DESC", { capacity: -1 }],
    ["createdAt_ASC", { createdAt: 1 }],
    ["createdAt_DESC", { createdAt: -1 }],
    ["name_ASC", { name: 1 }],
    ["name_DESC", { name: -1 }],
    ["apiUrl_ASC", { apiUrl: 1 }],
    ["apiUrl_DESC", { apiUrl: -1 }],
    ["firstName_ASC", { firstName: 1 }],
    ["firstName_DESC", { firstName: -1 }],
    ["lastName_ASC", { lastName: 1 }],
    ["lastName_DESC", { lastName: -1 }],
    ["email_ASC", { email: 1 }],
    ["email_DESC", { email: -1 }],
    ["text_ASC", { text: 1 }],
    ["text_DESC", { text: -1 }],
    ["imageUrl_ASC", { imageUrl: 1 }],
    ["imageUrl_DESC", { imageUrl: -1 }],
    ["videoUrl_ASC", { videoUrl: 1 }],
    ["videoUrl_DESC", { videoUrl: -1 }],
    ["likeCount_ASC", { likeCount: 1 }],
    ["likeCount_DESC", { likeCount: -1 }],
    ["commentCount_ASC", { commentCount: 1 }],
    ["commentCount_DESC", { commentCount: -1 }],
    ["fundingGoal_ASC", { fundingGoal: 1 }],
    ["fundingGoal_DESC", { fundingGoal: -1 }],
    ["dueDate_ASC", { dueDate: 1 }],
    ["dueDate_DESC", { dueDate: -1 }],
  ];

  it.each(testCases)(
    "should return correct sort for %s",
    (orderBy, expected) => {
      const result = getSort(
        orderBy as
          | EventOrderByInput
          | OrganizationOrderByInput
          | PostOrderByInput
          | UserOrderByInput
          | VenueOrderByInput
          | PledgeOrderByInput
          | FundOrderByInput
          | CampaignOrderByInput,
      );
      expect(result).toEqual(expected);
    },
  );

  it("should return empty object for unknown orderBy value", () => {
    const result = getSort("unknown" as UserOrderByInput);
    expect(result).toEqual({});
  });

  it("should return empty object for undefined orderBy", () => {
    const result = getSort(undefined);
    expect(result).toEqual({});
  });
});
