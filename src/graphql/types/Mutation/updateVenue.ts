import { eq } from "drizzle-orm";
import { z } from "zod";
import { ulid } from "ulidx";
import { venuesTable } from "~/src/drizzle/tables/venues";
import { venueAttachmentMimeTypeEnum } from "~/src/drizzle/enums/venueAttachmentMimeType";
import { builder } from "~/src/graphql/builder";
import type { FileUpload } from "graphql-upload-minimal";
import {
  MutationUpdateVenueInput,
  mutationUpdateVenueInputSchema,
} from "~/src/graphql/inputs/MutationUpdateVenueInput"
import { Venue } from "~/src/graphql/types/Venue/Venue"
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError"
import { isNotNullish } from "~/src/utilities/isNotNullish"
import { venueAttachmentsTable } from "~/src/drizzle/schema"
const mutationUpdateVenueArgumentsSchema = z.object({
  input: mutationUpdateVenueInputSchema.transform(async (arg, ctx) => {
    let attachments:
      | (FileUpload & {
          mimetype: z.infer<typeof venueAttachmentMimeTypeEnum>
        })[]
      | undefined

    if (arg.attachments !== undefined) {
      const rawAttachments = await Promise.all(arg.attachments)
      const { data, error, success } = venueAttachmentMimeTypeEnum
        .array()
        .safeParse(rawAttachments.map((attachment) => attachment.mimetype))

      if (!success) {
        for (const issue of error.issues) {
          // `issue.path[0]` would correspond to the numeric index of the attachment within `arg.attachments` array which contains the invalid mime type.
          if (typeof issue.path[0] === "number") {
            ctx.addIssue({
              code: "custom",
              path: ["attachments", issue.path[0]],
              message: `Mime type "${
                rawAttachments[issue.path[0]]?.mimetype
              }" is not allowed.`,
            })
          }
        }
      } else {
        attachments = rawAttachments.map((attachment, index) =>
          Object.assign(attachment, {
            mimetype: data[index],
          })
        )
      }
    }

    return {
      ...arg,
      attachments,
    }
  }),
})

builder.mutationField("updateVenue", (t) =>
  t.field({
    args: {
      input: t.arg({
        description: "",
        required: true,
        type: MutationUpdateVenueInput,
      }),
    },
    description: "Mutation field to update a venue.",
    resolve: async (_parent, args, ctx) => {
      if (!ctx.currentClient.isAuthenticated) {
        throw new TalawaGraphQLError({
          extensions: {
            code: "unauthenticated",
          },
        })
      }

      const {
        data: parsedArgs,
        error,
        success,
      } = await mutationUpdateVenueArgumentsSchema.safeParseAsync(args)

      if (!success) {
        throw new TalawaGraphQLError({
          extensions: {
            code: "invalid_arguments",
            issues: error.issues.map((issue) => ({
              argumentPath: issue.path,
              message: issue.message,
            })),
          },
        })
      }

      const currentUserId = ctx.currentClient.user.id

      const [currentUser, existingVenue] = await Promise.all([
        ctx.drizzleClient.query.usersTable.findFirst({
          columns: {
            role: true,
          },
          where: (fields, operators) => operators.eq(fields.id, currentUserId),
        }),
        ctx.drizzleClient.query.venuesTable.findFirst({
          columns: {
            organizationId: true,
          },
          with: {
            organization: {
              columns: {
                countryCode: true,
              },
              with: {
                membershipsWhereOrganization: {
                  columns: {
                    role: true,
                  },
                  where: (fields, operators) =>
                    operators.eq(fields.memberId, currentUserId),
                },
              },
            },
            attachmentsWhereVenue: true,
          },
          where: (fields, operators) =>
            operators.eq(fields.id, parsedArgs.input.id),
        }),
      ])

      if (currentUser === undefined) {
        throw new TalawaGraphQLError({
          extensions: {
            code: "unauthenticated",
          },
        })
      }

      if (existingVenue === undefined) {
        throw new TalawaGraphQLError({
          extensions: {
            code: "arguments_associated_resources_not_found",
            issues: [
              {
                argumentPath: ["input", "id"],
              },
            ],
          },
        })
      }

      if (isNotNullish(parsedArgs.input.name)) {
        // venue with the same name exits
        const existingVenueWithName =
          await ctx.drizzleClient.query.venuesTable.findFirst({
            columns: {
              id: true,
            },
            where: (fields, operators) =>
              operators.and(
                operators.eq(
                  fields.organizationId,
                  existingVenue.organizationId
                ), //new name present in the same organization
                operators.eq(fields.name, parsedArgs.input.name as string), //  Same name
                operators.ne(fields.id, parsedArgs.input.id) // Exclude current venue
              ),
          })

        if (existingVenueWithName) {
          throw new TalawaGraphQLError({
            extensions: {
              code: "forbidden_action_on_arguments_associated_resources",
              issues: [
                {
                  argumentPath: ["input", "name"],
                  message: "This name is not available.",
                },
              ],
            },
          })
        }
      }

      const currentUserOrganizationMembership =
        existingVenue.organization.membershipsWhereOrganization[0]

      if (
        currentUser.role !== "administrator" &&
        (currentUserOrganizationMembership === undefined ||
          currentUserOrganizationMembership.role !== "administrator")
      ) {
        throw new TalawaGraphQLError({
          extensions: {
            code: "unauthorized_action_on_arguments_associated_resources",
            issues: [
              {
                argumentPath: ["input", "id"],
              },
            ],
          },
        })
      }

      const [updatedVenue] = await ctx.drizzleClient
        .update(venuesTable)
        .set({
          description: parsedArgs.input.description,
          name: parsedArgs.input.name,
          updaterId: currentUserId,
          capacity: parsedArgs.input.capacity,
        })
        .where(eq(venuesTable.id, parsedArgs.input.id))
        .returning()
      // Updated venue not being returned means that either it was deleted or its `id` column was changed by external entities before this update operation could take place.
      if (!updatedVenue) {
        throw new TalawaGraphQLError({
          extensions: {
            code: "unexpected",
          },
        })
      }

      const existingAttachments =
        await ctx.drizzleClient.query.venueAttachmentsTable.findMany({
          where: (fields, operators) =>
            operators.eq(fields.venueId, updatedVenue.id),
        })
      if (parsedArgs.input.attachments) {
        const attachments = parsedArgs.input.attachments
        // Update the attachment
        if (existingAttachments?.[0]?.name && attachments[0]) {
          const attachment = attachments[0]
          // delete old attachment from minio
          await ctx.minio.client.removeObject(
            ctx.minio.bucketName,
            existingAttachments[0].name
          )

          // add new attachment to minio and update attachment record in db
          const updatedVenueAttachments = await ctx.drizzleClient
            .update(venueAttachmentsTable)
            .set({
              mimeType: attachment.mimetype,
              name: ulid(),
              updatedAt: new Date(),
              updaterId: currentUserId,
            })
            .where(eq(venueAttachmentsTable.venueId, parsedArgs.input.id))
            .returning()

          await Promise.all(
            updatedVenueAttachments.map((attachment, index) => {
              if (attachments[index] !== undefined) {
                ctx.minio.client.putObject(
                  ctx.minio.bucketName,
                  attachment.name,
                  attachments[index].createReadStream(),
                  undefined,
                  {
                    "content-type": attachment.mimeType,
                  }
                )
              }
            })
          )
        } else {
          // add new attachment
          const newAttachments = await ctx.drizzleClient
            .insert(venueAttachmentsTable)
            .values(
              attachments.map((attachment) => ({
                mimeType: attachment.mimetype,
                name: ulid(),
                createdAt: new Date(),
                creatorId: currentUserId,
                venueId: parsedArgs.input.id,
              }))
            )
            .returning()

          await Promise.all(
            newAttachments.map(async (attachment, index) => {
              if (attachments[index]) {
                await ctx.minio.client.putObject(
                  ctx.minio.bucketName,
                  attachment.name,
                  attachments[index].createReadStream(),
                  undefined,
                  {
                    "content-type": attachment.mimeType,
                  }
                )
              }
            })
          )
        }
      } else if (existingAttachments?.length) {
        // delete old attachment from minio and remove it's record from the db
        if (existingAttachments[0]) {
          await ctx.minio.client.removeObject(
            ctx.minio.bucketName,
            existingAttachments[0].name
          )
          await ctx.drizzleClient
            .delete(venueAttachmentsTable)
            .where(eq(venueAttachmentsTable.venueId, parsedArgs.input.id))
        }
      }
      const updatedAttachments =
        await ctx.drizzleClient.query.venueAttachmentsTable.findMany({
          where: (fields, operators) =>
            operators.eq(fields.venueId, updatedVenue.id),
        })

      return Object.assign(updatedVenue, { attachments: updatedAttachments })
    },
    type: Venue,
  })
)
