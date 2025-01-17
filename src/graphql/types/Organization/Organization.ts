import type { organizationsTable } from "~/src/drizzle/tables/organizations";
import { builder } from "~/src/graphql/builder";
import { Iso3166Alpha2CountryCode } from "~/src/graphql/enums/Iso3166Alpha2CountryCode";

export type Organization = typeof organizationsTable.$inferSelect;

export const Organization = builder.objectRef<Organization>("Organization");

Organization.implement({
	description:
		"Organizations are controlled spaces of collections of users who associate with the purpose those organizations exist for.",
	fields: (t) => ({
		addressLine1: t.exposeString("addressLine1", {
			description: "Address line 1 of the organization's address.",
		}),
		addressLine2: t.exposeString("addressLine2", {
			description: "Address line 2 of the organization's address.",
		}),
		avatarMimeType: t.exposeString("avatarMimeType", {
			description: "Mime type of the avatar of the organization.",
		}),
		city: t.exposeString("city", {
			description: "Name of the city where the organization exists in.",
		}),
		countryCode: t.expose("countryCode", {
			description: "Country code of the country the organization exists in.",
			type: Iso3166Alpha2CountryCode,
		}),
		createdAt: t.expose("createdAt", {
			description: "Date time at the time the organization was created.",
			type: "DateTime",
		}),
		description: t.exposeString("description", {
			description: "Custom information about the organization.",
		}),
		id: t.exposeID("id", {
			description: "Global identifier of the organization.",
			nullable: false,
		}),
		name: t.exposeString("name", {
			description: "Name of the organization.",
		}),
		postalCode: t.exposeString("postalCode", {
			description: "Postal code of the organization.",
		}),
		state: t.exposeString("state", {
			description: "Name of the state the organization exists in.",
		}),
	}),
});
