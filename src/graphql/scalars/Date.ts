import { DateResolver } from "graphql-scalars";
import { builder } from "~/src/graphql/builder";

/**
 * More information at this link: {@link https://the-guild.dev/graphql/scalars/docs/scalars/date}
 */
builder.addScalarType("Date", DateResolver);

/**
 * `Date` scalar type for pothos schema.
 */
export type _Date = {
	Input: Date;
	Output: Date;
};
