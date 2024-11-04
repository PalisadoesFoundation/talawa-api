import { describe, expect, it } from "vitest";
import {
  parseUserTagSortedBy,
  parseUserTagMemberWhere,
  parseUserTagWhere,
  getUserTagGraphQLConnectionSort,
  getUserTagMemberGraphQLConnectionFilter,
  getUserTagGraphQLConnectionFilter,
} from "../../src/utilities/userTagsPaginationUtils";
import type { SortedByOrder } from "../../src/types/generatedGraphQLTypes";
import { Types } from "mongoose";

describe("parseUserTagWhere function", () => {
  it("returns the failure state if name isn't provided", async () => {
    const result = await parseUserTagWhere({});
    expect(result.isSuccessful).toEqual(false);
  });

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

describe("parseUserTagMemberWhere function", () => {
  it("returns the failure state if neither firstName nor lastName is provided", async () => {
    const result = await parseUserTagMemberWhere({});

    expect(result.isSuccessful).toEqual(false);
  });

  it("returns the failure state if firstName isn't a string", async () => {
    const result = await parseUserTagMemberWhere({
      firstName: { starts_with: Math.random() as unknown as string },
    });

    expect(result.isSuccessful).toEqual(false);
  });

  it("returns the failure state if lastName isn't a string", async () => {
    const result = await parseUserTagMemberWhere({
      firstName: { starts_with: "firstName" },
      lastName: { starts_with: Math.random() as unknown as string },
    });

    expect(result.isSuccessful).toEqual(false);
  });

  it("returns the success state if where input is nullish", async () => {
    const result = await parseUserTagMemberWhere(undefined);

    expect(result.isSuccessful).toEqual(true);
  });

  it("returns the success state if provided firstName is provided and lastName isn't", async () => {
    const result = await parseUserTagMemberWhere({
      firstName: { starts_with: "firstName" },
    });

    expect(result.isSuccessful).toEqual(true);
  });

  it("returns the success state if provided lastName is provided and firstName isn't", async () => {
    const result = await parseUserTagMemberWhere({
      lastName: { starts_with: "lastName" },
    });

    expect(result.isSuccessful).toEqual(true);
  });

  it("returns the success state if provided names are non-empty and valid strings", async () => {
    const result = await parseUserTagMemberWhere({
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

describe("getUserTagGraphQLConnectionFilter function", () => {
  it(`when sort order is "ASCENDING" argument cursor is non-null and argument direction corresponds to backward`, async () => {
    const cursor = "cursor";

    expect(
      getUserTagGraphQLConnectionFilter({
        cursor,
        direction: "BACKWARD",
        sortById: "ASCENDING",
        nameStartsWith: "userName",
      }),
    ).toEqual({
      _id: {
        $lt: cursor,
      },
      name: {
        $regex: /^userName/i,
      },
    });
  });

  it(`when sort order is "ASCENDING" argument cursor is non-null and argument direction corresponds to forward`, async () => {
    const cursor = "cursor";

    expect(
      getUserTagGraphQLConnectionFilter({
        cursor,
        direction: "FORWARD",
        sortById: "ASCENDING",
        nameStartsWith: "userName",
      }),
    ).toEqual({
      _id: {
        $gt: cursor,
      },
      name: {
        $regex: /^userName/i,
      },
    });
  });

  it(`when sort order is "DESCENDING" argument cursor is non-null and argument direction corresponds to backward`, async () => {
    const cursor = "cursor";

    expect(
      getUserTagGraphQLConnectionFilter({
        cursor,
        direction: "BACKWARD",
        sortById: "DESCENDING",
        nameStartsWith: "userName",
      }),
    ).toEqual({
      _id: {
        $gt: cursor,
      },
      name: {
        $regex: /^userName/i,
      },
    });
  });

  it(`when sort order is "DESCENDING" argument cursor is non-null and argument direction corresponds to forward`, async () => {
    const cursor = "cursor";

    expect(
      getUserTagGraphQLConnectionFilter({
        cursor,
        direction: "FORWARD",
        sortById: "DESCENDING",
        nameStartsWith: "userName",
      }),
    ).toEqual({
      _id: {
        $lt: cursor,
      },
      name: {
        $regex: /^userName/i,
      },
    });
  });
});

describe("getUserTagMemberGraphQLConnectionFilter function", () => {
  it(`when sort order is "ASCENDING" argument cursor is non-null and argument direction corresponds to backward`, async () => {
    const cursor = new Types.ObjectId().toString();

    expect(
      getUserTagMemberGraphQLConnectionFilter({
        cursor,
        direction: "BACKWARD",
        sortById: "ASCENDING",
        firstNameStartsWith: "firstName",
        lastNameStartsWith: "lastName",
      }),
    ).toEqual({
      _id: {
        $lt: new Types.ObjectId(cursor),
      },
      firstName: {
        $regex: /^firstName/i,
      },
      lastName: {
        $regex: /^lastName/i,
      },
    });
  });

  it(`when sort order is "ASCENDING" argument cursor is non-null and argument direction corresponds to forward`, async () => {
    const cursor = new Types.ObjectId().toString();

    expect(
      getUserTagMemberGraphQLConnectionFilter({
        cursor,
        direction: "FORWARD",
        sortById: "ASCENDING",
        firstNameStartsWith: "firstName",
        lastNameStartsWith: "lastName",
      }),
    ).toEqual({
      _id: {
        $gt: new Types.ObjectId(cursor),
      },
      firstName: {
        $regex: /^firstName/i,
      },
      lastName: {
        $regex: /^lastName/i,
      },
    });
  });

  it(`when sort order is "DESCENDING" argument cursor is non-null and argument direction corresponds to backward`, async () => {
    const cursor = new Types.ObjectId().toString();

    expect(
      getUserTagMemberGraphQLConnectionFilter({
        cursor,
        direction: "BACKWARD",
        sortById: "DESCENDING",
        firstNameStartsWith: "firstName",
        lastNameStartsWith: "lastName",
      }),
    ).toEqual({
      _id: {
        $gt: new Types.ObjectId(cursor),
      },
      firstName: {
        $regex: /^firstName/i,
      },
      lastName: {
        $regex: /^lastName/i,
      },
    });
  });

  it(`when sort order is "DESCENDING" argument cursor is non-null and argument direction corresponds to forward`, async () => {
    const cursor = new Types.ObjectId().toString();

    expect(
      getUserTagMemberGraphQLConnectionFilter({
        cursor,
        direction: "FORWARD",
        sortById: "DESCENDING",
        firstNameStartsWith: "firstName",
        lastNameStartsWith: "lastName",
      }),
    ).toEqual({
      _id: {
        $lt: new Types.ObjectId(cursor),
      },
      firstName: {
        $regex: /^firstName/i,
      },
      lastName: {
        $regex: /^lastName/i,
      },
    });
  });
});

describe("getUserTagGraphQLConnectionSort function", () => {
  it(`when sort order is "ASCENDING" and argument direction corresponds to backward`, async () => {
    expect(
      getUserTagGraphQLConnectionSort({
        direction: "BACKWARD",
        sortById: "ASCENDING",
      }),
    ).toEqual({
      _id: -1,
    });
  });

  it(`when sort order is "ASCENDING" and argument direction corresponds to forward`, async () => {
    expect(
      getUserTagGraphQLConnectionSort({
        direction: "FORWARD",
        sortById: "ASCENDING",
      }),
    ).toEqual({
      _id: 1,
    });
  });

  it(`when sort order is "DESCENDING" and argument direction corresponds to backward`, async () => {
    expect(
      getUserTagGraphQLConnectionSort({
        direction: "BACKWARD",
        sortById: "DESCENDING",
      }),
    ).toEqual({
      _id: 1,
    });
  });

  it(`when sort order is "DESCENDING" and argument direction corresponds to forward`, async () => {
    expect(
      getUserTagGraphQLConnectionSort({
        direction: "FORWARD",
        sortById: "DESCENDING",
      }),
    ).toEqual({
      _id: -1,
    });
  });
});
