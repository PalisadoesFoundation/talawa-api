import { GraphQLScalarType, Kind } from "graphql";
import { builder } from "~/src/graphql/builder";

export const BigIntResolver = new GraphQLScalarType({
	name: "BigInt",
	description: "BigInt custom scalar type",
	serialize(value) {
		return BigInt(value as string | number | bigint).toString();
	},
	parseValue(value) {
		return BigInt(value as string | number | bigint);
	},
	parseLiteral(ast) {
		if (ast.kind === Kind.INT || ast.kind === Kind.STRING) {
			return BigInt(ast.value);
		}
		throw new Error(`BigInt cannot represent non-integer value: ${ast}`);
	},
});

builder.addScalarType("BigInt", BigIntResolver);

/**
 * `BigInt` scalar type for pothos schema.
 */
export type _BigInt = {
	Input: bigint;
	Output: bigint;
};
