import { EmailAddressResolver } from "graphql-scalars";
import { builder } from "~/src/graphql/builder";

/**
 * More information at this link: {@link https://the-guild.dev/graphql/scalars/docs/scalars/email-address}
 */
export const EmailAddress = builder.addScalarType(
	"EmailAddress",
	EmailAddressResolver,
);

/**
 * `EmailAddress` scalar type for pothos schema.
 */
export type EmailAddress = {
	Input: string;
	Output: string;
};
