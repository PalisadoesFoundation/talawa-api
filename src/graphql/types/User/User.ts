import type { usersTable } from "~/src/drizzle/tables/users";
import { builder } from "~/src/graphql/builder";
import { Iso3166Alpha2CountryCode } from "~/src/graphql/enums/Iso3166Alpha2CountryCode";
import { UserEducationGrade } from "~/src/graphql/enums/UserEducationGrade";
import { UserEmploymentStatus } from "~/src/graphql/enums/UserEmploymentStatus";
import { UserMaritalStatus } from "~/src/graphql/enums/UserMaritalStatus";
import { UserNatalSex } from "~/src/graphql/enums/UserNatalSex";
import { UserRole } from "~/src/graphql/enums/UserRole";

export type User = typeof usersTable.$inferSelect;

export const User = builder.objectRef<User>("User");

User.implement({
	description: "",
	fields: (t) => ({
		address: t.exposeString("address", {
			description: "Address of the user.",
		}),
		avatarURI: t.exposeString("avatarURI", {
			description: "URI to the avatar of the user.",
		}),
		birthDate: t.expose("birthDate", {
			description: "Date of birth of the user.",
			type: "Date",
		}),
		city: t.exposeString("city", {
			description: "Name of the city where the user resides in.",
		}),
		countryCode: t.expose("countryCode", {
			description: "Country code of the country the user is a citizen of.",
			type: Iso3166Alpha2CountryCode,
		}),
		createdAt: t.expose("createdAt", {
			description: "Date time at the time the user was created.",
			type: "DateTime",
		}),
		description: t.exposeString("description", {
			description: "Custom information about the user.",
		}),
		educationGrade: t.expose("educationGrade", {
			description: "Primary education grade of the user.",
			type: UserEducationGrade,
		}),
		emailAddress: t.expose("emailAddress", {
			description: "Email address of the user.",
			type: "EmailAddress",
		}),
		employmentStatus: t.expose("employmentStatus", {
			description: "Employment status of the user.",
			type: UserEmploymentStatus,
		}),
		homePhoneNumber: t.expose("homePhoneNumber", {
			description:
				"The phone number to use to communicate with the user at their home.",
			type: "PhoneNumber",
		}),
		id: t.exposeID("id", {
			description: "Global identifier of the user.",
			nullable: false,
		}),
		isEmailAddressVerified: t.exposeBoolean("isEmailAddressVerified", {
			description:
				"Boolean to tell whether the user has verified their email address.",
		}),
		maritalStatus: t.expose("maritalStatus", {
			description: "Marital status of the user.",
			type: UserMaritalStatus,
		}),
		mobilePhoneNumber: t.expose("mobilePhoneNumber", {
			description:
				"The phone number to use to communicate with the user on their mobile phone.",
			type: "PhoneNumber",
		}),
		name: t.exposeString("name", {
			description: "Name of the user.",
		}),
		natalSex: t.expose("natalSex", {
			description: "The sex assigned to the user at their birth.",
			type: UserNatalSex,
		}),
		postalCode: t.exposeString("postalCode", {
			description: "Postal code of the user.",
		}),
		role: t.expose("role", {
			description: "Role assigned to the user in the application.",
			type: UserRole,
		}),
		state: t.exposeString("state", {
			description: "Name of the state the user resides in.",
		}),
		workPhoneNumber: t.expose("workPhoneNumber", {
			description:
				"The phone number to use to communicate with the user while they're at work.",
			type: "PhoneNumber",
		}),
	}),
});
