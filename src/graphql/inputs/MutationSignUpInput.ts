import { z } from "zod";
import { usersTableInsertSchema } from "~/src/drizzle/tables/users";
import { builder } from "~/src/graphql/builder";
import { Iso3166Alpha2CountryCode } from "~/src/graphql/enums/Iso3166Alpha2CountryCode";
import { UserEducationGrade } from "~/src/graphql/enums/UserEducationGrade";
import { UserEmploymentStatus } from "~/src/graphql/enums/UserEmploymentStatus";
import { UserMaritalStatus } from "~/src/graphql/enums/UserMaritalStatus";
import { UserNatalSex } from "~/src/graphql/enums/UserNatalSex";

export const mutationSignUpInputSchema = usersTableInsertSchema
	.omit({
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
		confirmedPassword: z.string().min(1).max(64),
		password: z.string().min(1).max(64),
	})
	.transform(({ confirmedPassword, ...transformedArg }, ctx) => {
		if (confirmedPassword !== transformedArg.password) {
			ctx.addIssue({
				code: "custom",
				path: ["confirmedPassword"],
				message: "Does not match the password.",
			});
			ctx.addIssue({
				code: "custom",
				path: ["password"],
				message: "Does not match the confirmed password.",
			});
		}

		return transformedArg;
	});

export const MutationSignUpInput = builder
	.inputRef<z.infer<typeof mutationSignUpInputSchema>>("MutationSignUpInput")
	.implement({
		description: "",
		fields: (t) => ({
			address: t.string({
				description: "Address of the user.",
			}),
			avatarURI: t.string({
				description: "URI to the avatar of the user.",
			}),
			birthDate: t.field({
				description: "Date of birth of the user.",
				type: "Date",
			}),
			city: t.string({
				description: "Name of the city where the user resides in.",
			}),
			confirmedPassword: t.string({
				description:
					"Confirmed password of the user to sign in to the application.",
				required: true,
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
			emailAddress: t.field({
				description: "Email address of the user.",
				required: true,
				type: "EmailAddress",
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
