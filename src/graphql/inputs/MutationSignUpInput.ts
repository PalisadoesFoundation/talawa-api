import type { FileUpload } from "graphql-upload-minimal";
import { z } from "zod";
import { usersTableInsertSchema } from "~/src/drizzle/tables/users";
import { builder } from "~/src/graphql/builder";
import { Iso639Set1LanguageCode } from "~/src/graphql/enums/Iso639Set1LanguageCode";
import { Iso3166Alpha2CountryCode } from "~/src/graphql/enums/Iso3166Alpha2CountryCode";
import { UserEducationGrade } from "~/src/graphql/enums/UserEducationGrade";
import { UserEmploymentStatus } from "~/src/graphql/enums/UserEmploymentStatus";
import { UserMaritalStatus } from "~/src/graphql/enums/UserMaritalStatus";
import { UserNatalSex } from "~/src/graphql/enums/UserNatalSex";

export const mutationSignUpInputSchema = usersTableInsertSchema
	.omit({
		avatarMimeType: true,
		avatarName: true,
		createdAt: true,
		creatorId: true,
		id: true,
		isEmailAddressVerified: true,
		passwordHash: true,
		role: true,
		updatedAt: true,
		updaterId: true,
	})
	.extend({
		avatar: z.custom<Promise<FileUpload>>().nullish(),
		password: z.string().min(1).max(64),
	});

export const MutationSignUpInput = builder
	.inputRef<z.infer<typeof mutationSignUpInputSchema>>("MutationSignUpInput")
	.implement({
		description: "",
		fields: (t) => ({
			addressLine1: t.string({
				description: "Address line 1 of the user's address.",
			}),
			addressLine2: t.string({
				description: "Address line 2 of the user's address.",
			}),
			birthDate: t.field({
				description: "Date of birth of the user.",
				type: "Date",
			}),
			city: t.string({
				description: "Name of the city where the user resides in.",
			}),
			countryCode: t.field({
				description: "Country code of the country the user is a citizen of.",
				type: Iso3166Alpha2CountryCode,
			}),
			description: t.string({
				description: "Custom information about the user.",
			}),
			educationGrade: t.field({
				description: "Primary education grade of the user.",
				type: UserEducationGrade,
			}),
			emailAddress: t.string({
				description: "Email address of the user.",
				required: true,
			}),
			employmentStatus: t.field({
				description: "Employment status of the user.",
				type: UserEmploymentStatus,
			}),
			homePhoneNumber: t.field({
				description:
					"The phone number to use to communicate with the user at their home.",
				type: "PhoneNumber",
			}),
			maritalStatus: t.field({
				description: "Marital status of the user.",
				type: UserMaritalStatus,
			}),
			mobilePhoneNumber: t.field({
				description:
					"The phone number to use to communicate with the user on their mobile phone.",
				type: "PhoneNumber",
			}),
			name: t.string({
				description: "Name of the user.",
				required: true,
			}),
			natalSex: t.field({
				description: "The sex assigned to the user at their birth.",
				type: UserNatalSex,
			}),
			naturalLanguageCode: t.field({
				description: "Language code of the user's preferred natural language.",
				type: Iso639Set1LanguageCode,
			}),
			password: t.string({
				description: "Password of the user to sign in to the application.",
				required: true,
			}),
			postalCode: t.string({
				description: "Postal code of the user.",
			}),
			state: t.string({
				description: "Name of the state the user resides in.",
			}),
			workPhoneNumber: t.field({
				description:
					"The phone number to use to communicate with the user while they're at work.",
				type: "PhoneNumber",
			}),
		}),
	});
