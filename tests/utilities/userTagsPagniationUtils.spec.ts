import { describe, expect, it } from "vitest";
import {
  parseUserTagSortedBy,
  parseUserTagUserWhere,
  parseUserTagWhere,
} from "../../src/utilities/userTagsPaginationUtils";
import type { SortedByOrder } from "../../src/types/generatedGraphQLTypes";

describe("parseUserTagWhere function", () => {
  it("returns the failure state if provided name.starts_with isn't a string", async () => {
    const result = await parseUserTagWhere({
      name: {
        starts_with: Math.random() as unknown as string,
      },
    });

    expect(result.isSuccessful).toEqual(false);
  });

  it("returns the success state if where input is nullish", async () => {
    const result = await parseUserTagWhere(undefined);

    expect(result.isSuccessful).toEqual(true);
  });

  it("returns the success state if provided name.starts_with is an empty string", async () => {
    const result = await parseUserTagWhere({
      name: {
        starts_with: "",
      },
    });

    expect(result.isSuccessful).toEqual(true);
  });
});

describe("parseUserTagUserWhere function", () => {
  it("returns the failure state if neither firstName nor lastName is provided", async () => {
    const result = await parseUserTagUserWhere({});

    expect(result.isSuccessful).toEqual(false);
  });

  it("returns the failure state if firstName isn't a string", async () => {
    const result = await parseUserTagUserWhere({
      firstName: { starts_with: Math.random() as unknown as string },
    });

    expect(result.isSuccessful).toEqual(false);
  });

  it("returns the failure state if lastName isn't a string", async () => {
    const result = await parseUserTagUserWhere({
      firstName: { starts_with: "firstName" },
      lastName: { starts_with: Math.random() as unknown as string },
    });

    expect(result.isSuccessful).toEqual(false);
  });

  it("returns the success state if where input is nullish", async () => {
    const result = await parseUserTagUserWhere(undefined);

    expect(result.isSuccessful).toEqual(true);
  });

  it("returns the success state if provided firstName is provided and lastName isn't", async () => {
    const result = await parseUserTagUserWhere({
      firstName: { starts_with: "firstName" },
    });

    expect(result.isSuccessful).toEqual(true);
  });

  it("returns the success state if provided lastName is provided and firstName isn't", async () => {
    const result = await parseUserTagUserWhere({
      lastName: { starts_with: "lastName" },
    });

    expect(result.isSuccessful).toEqual(true);
  });

  it("returns the success state if provided names are non-empty and valid strings", async () => {
    const result = await parseUserTagUserWhere({
      firstName: { starts_with: "firstName" },
      lastName: { starts_with: "lastName" },
    });

    expect(result.isSuccessful).toEqual(true);
  });
});

describe("parseUserTagSortedBy function", () => {
  it("returns the failure state if provided sortedBy isn't of type SortedByOrder", async () => {
    const result = await parseUserTagSortedBy({
      id: "" as unknown as SortedByOrder,
    });

    expect(result.isSuccessful).toEqual(false);
  });

  it("returns the success state if where input is nullish", async () => {
    const result = await parseUserTagSortedBy(undefined);

    expect(result.isSuccessful).toEqual(true);
  });

  it("returns the success state if provided sort order is valid", async () => {
    const result = await parseUserTagSortedBy({
      id: "ASCENDING",
    });

    expect(result.isSuccessful).toEqual(true);
  });
});
