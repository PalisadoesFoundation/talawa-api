type Paths<T> = T extends object
	? { [K in keyof T]: [K, ...Paths<T[K]>] | [K] }[keyof T]
	: never;

/**
 * This function takes in a javascript object and a list of key paths within that object as arguments and outputs all paths amongst those key paths that correspond to a non-undefined value.
 *
 * @example
 * ```typescript
 * const object = \\{
 *   field1: undefined,
 *   field2: "value2",
 *   field3: undefined,
 *   field4: null,
 *   field5: \\{
 *     field6: "value6",
 *   \\},
 *   field7: \\{
 *     field8: \\{
 *       field9: "value9",
 *       field10: undefined,
 *       field11: null
 *     \\}
 *   \\},
 *   field12: [
 *     "value12",
 *     undefined,
 *     null,
 *     \\{
 *       field13: "value13"
 *     \\}
 *   ]
 * \\}
 *
 * const keyPaths = getKeyPathsWithNonUndefinedValues([
 *   ["field1"],
 *   ["field2"],
 *   ["field4"]
 * ]);
 * ```
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
		const value = keyPath.reduce(
			(
				accumulator: Record<string | number | symbol, unknown> | undefined,
				key,
			) => {
				if (accumulator === undefined) return undefined;
				const val = accumulator[key as keyof typeof accumulator];
				return val !== undefined
					? (val as Record<string | number | symbol, unknown>)
					: undefined;
			},
			object as Record<string | number | symbol, unknown>,
		);

		if (value !== undefined) {
			keyPathsWithNonUndefinedValues.push(keyPath);
		}
	}

	return keyPathsWithNonUndefinedValues;
};
