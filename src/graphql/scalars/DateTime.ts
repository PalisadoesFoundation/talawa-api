import { DateTimeResolver } from "graphql-scalars";
import { builder } from "~/src/graphql/builder";

/**
 * More information at this link: {@link https://the-guild.dev/graphql/scalars/docs/scalars/date-time}
 */
builder.addScalarType("DateTime", DateTimeResolver);

/**
 * `DateTime` scalar type for pothos schema.
 */
export type DateTime = {
	Input: Date;
	Output: Date;
};
