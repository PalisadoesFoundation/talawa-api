import { z } from "zod";
import { usersTableInsertSchema } from "~/src/drizzle/tables/users";
import { builder } from "~/src/graphql/builder";
import { Iso3166Alpha2CountryCode } from "~/src/graphql/enums/Iso3166Alpha2CountryCode";
import { UserEducationGrade } from "~/src/graphql/enums/UserEducationGrade";
import { UserEmploymentStatus } from "~/src/graphql/enums/UserEmploymentStatus";
import { UserMaritalStatus } from "~/src/graphql/enums/UserMaritalStatus";
import { UserNatalSex } from "~/src/graphql/enums/UserNatalSex";

export const mutationUpdateCurrentUserInputSchema = usersTableInsertSchema
	.omit({
		createdAt: true,
		creatorId: true,
		emailAddress: true,
		id: true,
		isEmailAddressVerified: true,
		name: true,
		passwordHash: true,
		role: true,
		updatedAt: true,
		updaterId: true,
	})
	.extend({
		emailAddress: usersTableInsertSchema.shape.emailAddress.optional(),
		name: usersTableInsertSchema.shape.name.optional(),
		password: z.string().min(1).max(64).optional(),
	})
	.refine((arg) => Object.values(arg).some((value) => value !== undefined), {
		message: "At least one optional argument must be provided.",
	});

export const MutationUpdateCurrentUserInput = builder
	.inputRef<z.infer<typeof mutationUpdateCurrentUserInputSchema>>(
		"MutationUpdateCurrentUserInput",
	)
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
			}),
			natalSex: t.field({
				description: "The sex assigned to the user at their birth.",
				type: UserNatalSex,
			}),
			password: t.string({
				description: "Password of the user to sign in to the application.",
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
