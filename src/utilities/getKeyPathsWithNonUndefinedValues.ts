type Paths<T> = T extends object
	? { [K in keyof T]: [K, ...Paths<T[K]>] | [K] }[keyof T]
	: never;

/**
 * This function takes in a javascript object and a list of key paths within that object as arguments and outputs all paths amongst those key paths that correspond to a non-undefined value.
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
