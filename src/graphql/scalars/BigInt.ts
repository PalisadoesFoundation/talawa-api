import { BigIntResolver } from "graphql-scalars";
import { builder } from "~/src/graphql/builder";

/**
 * More information at this link: {@link https://the-guild.dev/graphql/scalars/docs/scalars/date}
 */
builder.addScalarType("BigInt", BigIntResolver);

/**
 * `BigInt` scalar type for pothos schema.
 */
export type _BigInt = {
	Input: bigint;
	Output: bigint;
};
