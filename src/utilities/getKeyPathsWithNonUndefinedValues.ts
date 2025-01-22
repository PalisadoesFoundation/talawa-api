type Paths<T> = T extends object
	? { [K in keyof T]: [K, ...Paths<T[K]>] | [K] }[keyof T]
	: never;

/**
 * This function takes in a javascript object and a list of key paths within that object as arguments and outputs all paths amongst those key paths that correspond to a non-undefined value.
 *
 * @example
 *
 * const object = {
 * 	field1: undefined,
 * 	field2: "value2",
 * 	field3: undefined,
 * 	field4: null,
 * 	field5: {
 * 		field6: "value6",
 * 	},
 * 	field7: {
 * 		field8: {
 * 				field9: "value9",
 * 				field10: undefined,
 * 				field11: null
 * 			}
 * 	},
 * 	field12: [
 * 		"value12",
 * 		undefined,
 * 		null,
 * 		{
 * 			field13: "value13"
 * 		}
 * 	]
 * }
 *
 * const keyPaths = getKeyPathsWithNonUndefinedValues([
 * 	["field1"],
 * 	["field2"],
 * 	["field4"]
 * ]);
 * const keyPaths = getKeyPathsWithNonUndefinedValues([
 * 	["field3"],
 * 	["field5", "field6"],
 * 	["field7", "field8", "field9"],
 * 	["field7", "field8", "field10"],
 * 	["field7", "field8", "field11"]
 * ]);
 * const keyPaths = getKeyPathsWithNonUndefinedValues([
 * 	["field12", 0],
 * 	["field12", 1],
 * 	["field12", 2],
 * 	["field12", 3, "field13"]
 * ]);
 */
export const getKeyPathsWithNonUndefinedValues = <
	T extends Record<string, unknown>,
>({
	keyPaths,
	object,
}: {
	keyPaths: Paths<T>[];
	object: T;
}): Paths<T>[] => {
	const keyPathsWithNonUndefinedValues: Paths<T>[] = [];

	for (const keyPath of keyPaths) {
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		const value = keyPath.reduce((accumulator: any, key) => {
			return accumulator && accumulator[key] !== undefined
				? accumulator[key]
				: undefined;
		}, object);

		if (value !== undefined) {
			keyPathsWithNonUndefinedValues.push(keyPath);
		}
	}

	return keyPathsWithNonUndefinedValues;
};
