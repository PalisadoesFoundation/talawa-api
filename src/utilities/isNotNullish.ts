/**
 * This function is used to check nullish state of a value passed to it. Nullish means the value being either `null` or `undefined`. If the value is found to be nullish, the function returns the boolean `false`, else it returns the boolean `true`.
 * @example
 * function print(str: string | null) {
 * 	if (isNotNullish(str)) {
 * 		console.log(`the string is ${str}`);
 * 	} else {
 * 		console.log(`the string is null`);
 * 	}
 * }
 */
export function isNotNullish<T0>(value: T0 | undefined | null): value is T0 {
	return value !== undefined && value !== null;
}
