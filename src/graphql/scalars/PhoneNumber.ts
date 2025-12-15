import { PhoneNumberResolver } from "graphql-scalars";
import { builder } from "~/src/graphql/builder";

/**
 * More information at this link: {@link https://the-guild.dev/graphql/scalars/docs/scalars/phone-number}
 */
builder.addScalarType("PhoneNumber", PhoneNumberResolver);

/**
 * `PhoneNumber` scalar type for pothos schema.
 */
export type PhoneNumber = {
	Input: string;
	Output: string;
};
