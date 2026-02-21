import { hash } from "@node-rs/argon2";
import { and, eq } from "drizzle-orm";
import type { FileUpload } from "graphql-upload-minimal";
import { ulid } from "ulidx";
import { uuidv7 } from "uuidv7";
import { z } from "zod";
import { imageMimeTypeEnum } from "~/src/drizzle/enums/imageMimeType";
import { membershipRequestsTable } from "~/src/drizzle/tables/membershipRequests";
import { organizationMembershipsTable } from "~/src/drizzle/tables/organizationMemberships";
import { usersTable } from "~/src/drizzle/tables/users";
import { builder } from "~/src/graphql/builder";
import {
	MutationSignUpInput,
	mutationSignUpInputSchema,
} from "~/src/graphql/inputs/MutationSignUpInput";
import { User } from "~/src/graphql/types/User/User";
import { emailService } from "~/src/services/email/emailServiceInstance";
import {
	getOnSpotAttendeeWelcomeEmailHtml,
	getOnSpotAttendeeWelcomeEmailText,
} from "~/src/utilities/emailTemplates";
import envConfig from "~/src/utilities/graphqLimits";
import { isNotNullish } from "~/src/utilities/isNotNullish";
// Token generation removed - admin attendees do not receive auto-generated tokens
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

/**
 * Input schema for admin on-spot attendee creation
 * Uses the same base as signUp but accepts all fields required for event registration
 */
const adminCreateOnSpotAttendeeInputSchema = mutationSignUpInputSchema.omit({
	recaptchaToken: true, // Admin doesn't need reCAPTCHA
});

const mutationAdminCreateOnSpotAttendeeArgumentsSchema = z.object({
	input: adminCreateOnSpotAttendeeInputSchema.transform(async (arg, ctx) => {
		let avatar:
			| (FileUpload & {
					mimetype: z.infer<typeof imageMimeTypeEnum>;
			  })
			| null
			| undefined;

		if (isNotNullish(arg.avatar)) {
			const rawAvatar = await arg.avatar;
			const { data, success } = imageMimeTypeEnum.safeParse(rawAvatar.mimetype);

			if (!success) {
				ctx.addIssue({
					code: "custom",
					path: ["avatar"],
					message: `Mime type "${rawAvatar.mimetype}" is not allowed.`,
				});
			} else {
				avatar = Object.assign(rawAvatar, {
					mimetype: data,
				});
			}
		} else if (arg.avatar !== undefined) {
			avatar = null;
		}

		return {
			...arg,
			avatar,
		};
	}),
});

builder.mutationField("adminCreateOnSpotAttendee", (t) =>
	t.field({
		args: {
			input: t.arg({
				description:
					"Input for admin on-spot attendee creation. Only available to authenticated admin users.",
				required: true,
				type: MutationSignUpInput,
			}),
		},
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		description:
			"Admin-only mutation to create on-spot event attendees with auto-verified email.",
		resolve: async (_parent, args, ctx) => {
			// ========================================
			// BASIC AUTH CHECK: Verify authentication
			// ========================================
			if (!ctx.currentClient.isAuthenticated) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
						message: "You must be authenticated to perform this action.",
					},
				});
			}

			if (ctx.currentClient.user?.id === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "forbidden_action",
						message: "Invalid user context.",
					},
				});
			}

			// ========================================
			// VALIDATION: Parse and validate input FIRST
			// ========================================
			const parseResult =
				await mutationAdminCreateOnSpotAttendeeArgumentsSchema.safeParseAsync(
					args,
				);

			if (!parseResult.success) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: parseResult.error.issues.map((issue) => ({
							argumentPath: issue.path,
							message: issue.message,
						})),
					},
				});
			}

			const parsedArgs = parseResult.data;

			// ========================================
			// AUTHORIZATION CHECK: Verify admin access
			// ========================================
			// Check if user is an admin in the SPECIFIC organization
			// This validates the user can create attendees for this organization
			const currentUser = await ctx.drizzleClient.query.usersTable.findFirst({
				where: eq(usersTable.id, ctx.currentClient.user?.id),
			});

			// fetch org membership
			const currentUserMembership =
				await ctx.drizzleClient.query.organizationMembershipsTable.findFirst({
					where: and(
						eq(
							organizationMembershipsTable.memberId,
							ctx.currentClient.user?.id,
						),
						eq(
							organizationMembershipsTable.organizationId,
							parsedArgs.input.selectedOrganization,
						),
					),
				});

			// ADMIN CHECK (matches sendEventInvitations logic)
			if (
				currentUser?.role !== "administrator" &&
				currentUserMembership?.role !== "administrator"
			) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "forbidden_action",
						message:
							"Only organization admins can create on-spot attendees. You must have an admin role.",
					},
				});
			}

			// ========================================
			// CHECK: Verify email not already registered
			// ========================================
			const [[existingUserWithEmailAddress], existingOrganization] =
				await Promise.all([
					ctx.drizzleClient
						.select()
						.from(usersTable)
						.where(eq(usersTable.emailAddress, parsedArgs.input.emailAddress)),
					ctx.drizzleClient.query.organizationsTable.findFirst({
						where: (fields, operators) =>
							operators.eq(fields.id, parsedArgs.input.selectedOrganization),
					}),
				]);

			if (existingUserWithEmailAddress !== undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "forbidden_action_on_arguments_associated_resources",
						issues: [
							{
								argumentPath: ["input", "emailAddress"],
								message: "This email address is already registered.",
							},
						],
					},
				});
			}

			if (existingOrganization === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "forbidden_action_on_arguments_associated_resources",
						issues: [
							{
								argumentPath: ["input", "selectedOrganization"],
								message: "This organization does not exist.",
							},
						],
					},
				});
			}

			// ========================================
			// CREATE: User with auto-verified email
			// ========================================
			const userId = uuidv7();
			let avatarMimeType: z.infer<typeof imageMimeTypeEnum>;
			let avatarName: string;

			if (isNotNullish(parsedArgs.input.avatar)) {
				avatarName = ulid();
				avatarMimeType = parsedArgs.input.avatar.mimetype;
			}

			const result = await ctx.drizzleClient.transaction(async (tx) => {
				const [createdUser] = await tx
					.insert(usersTable)
					.values({
						addressLine1: parsedArgs.input.addressLine1,
						addressLine2: parsedArgs.input.addressLine2,
						avatarMimeType,
						avatarName,
						birthDate: parsedArgs.input.birthDate,
						city: parsedArgs.input.city,
						countryCode: parsedArgs.input.countryCode,
						creatorId: userId,
						description: parsedArgs.input.description,
						educationGrade: parsedArgs.input.educationGrade,
						emailAddress: parsedArgs.input.emailAddress,
						employmentStatus: parsedArgs.input.employmentStatus,
						homePhoneNumber: parsedArgs.input.homePhoneNumber,
						id: userId,
						// On-spot attendees: email is automatically verified
						isEmailAddressVerified: true,
						maritalStatus: parsedArgs.input.maritalStatus,
						mobilePhoneNumber: parsedArgs.input.mobilePhoneNumber,
						name: parsedArgs.input.name,
						natalSex: parsedArgs.input.natalSex,
						naturalLanguageCode: parsedArgs.input.naturalLanguageCode,
						passwordHash: await hash(parsedArgs.input.password),
						postalCode: parsedArgs.input.postalCode,
						role: "regular",
						state: parsedArgs.input.state,
						workPhoneNumber: parsedArgs.input.workPhoneNumber,
					})
					.returning();

				if (createdUser === undefined) {
					ctx.log.error(
						"Postgres insert operation unexpectedly returned an empty array instead of throwing an error.",
					);

					throw new TalawaGraphQLError({
						extensions: {
							code: "unexpected",
						},
					});
				}

				if (isNotNullish(parsedArgs.input.avatar)) {
					await ctx.minio.client.putObject(
						ctx.minio.bucketName,
						avatarName,
						parsedArgs.input.avatar.createReadStream(),
						undefined,
						{
							"content-type": parsedArgs.input.avatar.mimetype,
						},
					);
				}

				// Create organization membership (on-spot attendees are auto-approved)
				if (existingOrganization.userRegistrationRequired === false) {
					const [createdOrganizationMembership] = await tx
						.insert(organizationMembershipsTable)
						.values({
							creatorId: ctx.currentClient.user?.id,
							memberId: createdUser.id,
							organizationId: parsedArgs.input.selectedOrganization,
							role: "regular",
						})
						.returning();

					if (createdOrganizationMembership === undefined) {
						ctx.log.error(
							"Postgres insert operation unexpectedly returned an empty array instead of throwing an error.",
						);

						throw new TalawaGraphQLError({
							extensions: {
								code: "unexpected",
							},
						});
					}
				} else {
					const newRequest = await tx
						.insert(membershipRequestsTable)
						.values({
							userId: createdUser.id,
							organizationId: parsedArgs.input.selectedOrganization,
						})
						.returning();

					if (newRequest.length === 0) {
						throw new TalawaGraphQLError({
							extensions: { code: "unexpected" },
						});
					}
				}

				// Note: On-spot attendees do not receive auto-generated tokens.
				// They must authenticate using their email and temporary password.
				return createdUser;
			});

			// ========================================
			// SEND: Welcome email with credentials
			// ========================================
			try {
				const emailContext = {
					userName: result.name,
					communityName: ctx.envConfig.API_COMMUNITY_NAME,
					emailAddress: result.emailAddress,
					temporaryPassword: parsedArgs.input.password,
					loginLink: `${ctx.envConfig.API_FRONTEND_URL}/login`,
				};

				emailService
					.sendEmail({
						id: ulid(),
						email: result.emailAddress,
						subject: `Welcome to ${ctx.envConfig.API_COMMUNITY_NAME} - Your Account is Ready`,
						htmlBody: getOnSpotAttendeeWelcomeEmailHtml(emailContext),
						textBody: getOnSpotAttendeeWelcomeEmailText(emailContext),
						userId: result.id,
					})
					.catch((err) =>
						ctx.log.error(
							{ error: err },
							"Failed to send on-spot attendee welcome email",
						),
					);
			} catch (err) {
				ctx.log.error({ error: err }, "Failed to send on-spot welcome email");
			}
			return result;
		},
		type: User,
	}),
);
