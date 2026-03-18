import { z } from "zod";
import { baseEventsTableInsertSchema } from "~/src/drizzle/tables/events";
import { isNotNullish } from "~/src/utilities/isNotNullish";

export const mutationUpdateEventInputSchema = z
	.object({
		description: baseEventsTableInsertSchema.shape.description.optional(),
		endAt: z.date().optional(),
		startAt: z.date().optional(),
		startDate: z.string().date().optional(),
		endDate: z.string().date().optional(),
		allDay: z.boolean().optional(),
		id: baseEventsTableInsertSchema.shape.id.unwrap(),
		name: baseEventsTableInsertSchema.shape.name.optional(),
		isInviteOnly: baseEventsTableInsertSchema.shape.isInviteOnly.optional(),
		isPublic: baseEventsTableInsertSchema.shape.isPublic.optional(),
		isRegisterable: baseEventsTableInsertSchema.shape.isRegisterable.optional(),
		location: baseEventsTableInsertSchema.shape.location.optional(),
	})
	.superRefine(({ id, ...remainingArg }, ctx) => {
		if (!Object.values(remainingArg).some((value) => value !== undefined)) {
			ctx.addIssue({
				code: "custom",
				message: "At least one optional argument must be provided.",
			});
		}

		// Check for mixed representations (startAt with startDate or endAt with endDate)
		if (
			remainingArg.startAt !== undefined &&
			remainingArg.startDate !== undefined
		) {
			ctx.addIssue({
				code: "custom",
				message:
					"Cannot provide both startAt (timed) and startDate (all-day) in the same update.",
				path: ["startAt"],
			});
		}
		if (
			remainingArg.endAt !== undefined &&
			remainingArg.endDate !== undefined
		) {
			ctx.addIssue({
				code: "custom",
				message:
					"Cannot provide both endAt (timed) and endDate (all-day) in the same update.",
				path: ["endAt"],
			});
		}

		// When allDay is explicitly set to true, forbid timed fields
		if (remainingArg.allDay === true) {
			if (remainingArg.startAt !== undefined) {
				ctx.addIssue({
					code: "custom",
					message:
						"Cannot provide startAt when allDay is true. Use startDate instead.",
					path: ["startAt"],
				});
			}
			if (remainingArg.endAt !== undefined) {
				ctx.addIssue({
					code: "custom",
					message:
						"Cannot provide endAt when allDay is true. Use endDate instead.",
					path: ["endAt"],
				});
			}
		}

		// When allDay is explicitly set to false, forbid all-day fields
		if (remainingArg.allDay === false) {
			if (remainingArg.startDate !== undefined) {
				ctx.addIssue({
					code: "custom",
					message:
						"Cannot provide startDate when allDay is false. Use startAt instead.",
					path: ["startDate"],
				});
			}
			if (remainingArg.endDate !== undefined) {
				ctx.addIssue({
					code: "custom",
					message:
						"Cannot provide endDate when allDay is false. Use endAt instead.",
					path: ["endDate"],
				});
			}
		}

		// Validate timed event: if both startAt and endAt are provided, endAt must be after startAt
		if (
			isNotNullish(remainingArg.endAt) &&
			isNotNullish(remainingArg.startAt) &&
			remainingArg.endAt <= remainingArg.startAt
		) {
			ctx.addIssue({
				code: "custom",
				message: `End time must be after start time: ${remainingArg.startAt.toISOString()}.`,
				path: ["endAt"],
			});
		}
		// Validate all-day event: if both startDate and endDate are provided, endDate must be after startDate
		if (
			isNotNullish(remainingArg.endDate) &&
			isNotNullish(remainingArg.startDate) &&
			remainingArg.endDate <= remainingArg.startDate
		) {
			ctx.addIssue({
				code: "custom",
				message: `End date must be after start date for all-day events: ${remainingArg.startDate}.`,
				path: ["endDate"],
			});
		}
	});
