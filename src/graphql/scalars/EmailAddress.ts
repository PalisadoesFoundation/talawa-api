import { EmailAddressResolver } from "graphql-scalars";
import { builder } from "~/src/graphql/builder";

/**
 * A custom scalar type for validating email addresses according to RFC 5322.
 * This ensures that all email fields in the schema are properly validated.
 * More information at this link: {@link https://the-guild.dev/graphql/scalars/docs/scalars/email-address}
 */
export const EmailAddress = builder.addScalarType(
	"EmailAddress",
	EmailAddressResolver,
);

/**
 * `EmailAddress` scalar type for pothos schema.
 * The underscore prefix indicates this is an internal type definition.
 * @example
 * Valid: user\\@example.com
 * Invalid: user\\@, user\\@.com, \\@example.com
 */
export type _EmailAddress = {
	Input: string;
	Output: string;
};
