import { describe, expect, it } from "vitest";
import {
	getKeyPathsWithNonUndefinedValues,
	type Paths,
} from "../../src/utilities/getKeyPathsWithNonUndefinedValues";

describe("getKeyPathsWithNonUndefinedValues", () => {
	it("should return paths for simple object with non-undefined values", () => {
		const object = {
			a: 1,
			b: "string",
			c: null,
			d: undefined,
		};
		const keyPaths: Paths<typeof object>[] = [["a"], ["b"], ["c"], ["d"]];

		const result = getKeyPathsWithNonUndefinedValues({ keyPaths, object });

		expect(result).toHaveLength(3);
		expect(result).toContainEqual(["a"]);
		expect(result).toContainEqual(["b"]);
		expect(result).toContainEqual(["c"]);
		expect(result).not.toContainEqual(["d"]);
	});

	it("should handle nested objects", () => {
		const object = {
			nested: {
				x: 10,
				y: undefined,
			},
		};
		const keyPaths: Paths<typeof object>[] = [
			["nested", "x"],
			["nested", "y"],
		];

		const result = getKeyPathsWithNonUndefinedValues({ keyPaths, object });

		expect(result).toHaveLength(1);
		expect(result).toContainEqual(["nested", "x"]);
	});

	it("should handle nested arrays (treated as objects with numeric keys)", () => {
		const object = {
			list: [1, undefined, 3],
		};
		// In the original type/implementation, array indices are keys.
		// Paths<T> handles object keys. For arrays, keys are "0", "1", etc.
		// However, the reduce uses `key` which can be string | number | symbol.
		const keyPaths = [
			["list", 0],
			["list", 1],
			["list", 2],
		] as unknown as Paths<typeof object>[];

		const result = getKeyPathsWithNonUndefinedValues({ keyPaths, object });

		expect(result).toHaveLength(2);
		expect(result).toContainEqual(["list", 0]);
		expect(result).toContainEqual(["list", 2]);
	});

	it("should return empty array if all values are undefined", () => {
		const object = {
			a: undefined,
			b: undefined,
		};
		const keyPaths: Paths<typeof object>[] = [["a"], ["b"]];

		const result = getKeyPathsWithNonUndefinedValues({ keyPaths, object });

		expect(result).toEqual([]);
	});

	it("should return empty array if keyPaths is empty", () => {
		const object = { a: 1 };
		const keyPaths: Paths<typeof object>[] = [];

		const result = getKeyPathsWithNonUndefinedValues({ keyPaths, object });

		expect(result).toEqual([]);
	});

	it("should return correct paths when some paths don't exist in object (result undefined)", () => {
		const object = {
			a: 1,
		};
		const keyPaths = [["a"], ["b"], ["c", "d"]] as unknown as Paths<
			typeof object
		>[];

		const result = getKeyPathsWithNonUndefinedValues({ keyPaths, object });

		expect(result).toEqual([["a"]]);
	});

	it("should handle path breaking gracefully (undefined intermediate)", () => {
		const object = {
			a: undefined,
		};
		// trying to access object.a.b where object.a is undefined
		const keyPaths = [["a", "b"]] as unknown as Paths<typeof object>[];

		const result = getKeyPathsWithNonUndefinedValues({ keyPaths, object });

		expect(result).toEqual([]);
	});

	it("should handle complex nested structure", () => {
		const object = {
			field1: undefined,
			field2: "value2",
			field5: {
				field6: "value6",
			},
			field7: {
				field8: {
					field9: "value9",
					field10: undefined,
					field11: null,
				},
			},
			field12: ["value12", undefined, null, { field13: "value13" }],
		};

		const keyPaths = [
			["field1"],
			["field2"],
			["field5", "field6"],
			["field7", "field8", "field9"],
			["field7", "field8", "field10"],
			["field7", "field8", "field11"],
			["field12", 0],
			["field12", 1],
			["field12", 2],
			["field12", 3, "field13"],
		] as unknown as Paths<typeof object>[];

		const result = getKeyPathsWithNonUndefinedValues({ keyPaths, object });

		expect(result).toContainEqual(["field2"]);
		expect(result).toContainEqual(["field5", "field6"]);
		expect(result).toContainEqual(["field7", "field8", "field9"]);
		expect(result).toContainEqual(["field7", "field8", "field11"]);
		expect(result).toContainEqual(["field12", 0]);
		expect(result).toContainEqual(["field12", 2]);
		expect(result).toContainEqual(["field12", 3, "field13"]);

		expect(result).not.toContainEqual(["field1"]);
		expect(result).not.toContainEqual(["field7", "field8", "field10"]);
		expect(result).not.toContainEqual(["field12", 1]);
	});
});
