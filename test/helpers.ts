import { isDeepStrictEqual } from "node:util";
import { and } from "drizzle-orm";
import { notificationTemplatesTable } from "~/src/drizzle/tables/NotificationTemplate";
import { server } from "./server";

/**
 * This function is used to narrow the type of a value passed to it to not be equal to `null` or `undefined`. More information can be found at the following links:
 *
 * {@link https://github.com/vitest-dev/vitest/issues/2883#issuecomment-2176048122}
 *
 * {@link https://github.com/vitest-dev/vitest/issues/5702#issuecomment-2176048295}
 *
 * @example
 *
 * const func = (name: string | null | undefined) => {
 * 	assertToBeNonNullish(name);
 * 	console.log(name.length);
 * }
 */
export function assertToBeNonNullish<T>(
	value: T | null | undefined,
	message?: string,
): asserts value is T {
	if (value === undefined || value === null) {
		const pretty = value === undefined ? "undefined" : value === null ? "null" : JSON.stringify(value);
		throw new Error(`${message ?? "Not a non-nullish value."} — Actual: ${pretty}`);
	}
}

/**
 * This function is useful for checking if the sequence passed to it as the first argument is a subsequence of the sequence passed to it as the second argument. A subsequence is a sequence that can be derived from another sequence by deleting some or no elements from the latter without changing the order of the remaining elements.
 *
 * @example
 * if(isSubsequence([3, 4, 1, 9, 2], [1, 2]){
 * 	console.log("[1, 2] is a subsequence of [3, 4, 1, 9, 2].")
 * }
 */
export const isSubSequence = <T>(sequence: T[], subsequence: T[]) => {
	let j = 0;
	// Iterate through the sequence to find the subsequence in order.
	for (let i = 0; i < sequence.length; i += 1) {
		if (isDeepStrictEqual(sequence[i], subsequence[j])) {
			j += 1;
		}
		// Return true if the matching for the entire subsequence has completed.
		if (j === subsequence.length) {
			return true;
		}
	}
	// Return true or false depending on whether the matching for the entire subsequence has completed along with the loop exit.
	return j === subsequence.length;
};

/**
 * Common notification templates to seed in the test database.
 */
const COMMON_NOTIFICATION_TEMPLATES = [
	{
		eventType: "fund_created",
		channelType: "in_app",
		name: "Fund Created",
		title: "Fund Created",
		body: "A new fund has been created: {fundName}",
	},
	{
		eventType: "fund_campaign_created",
		channelType: "in_app",
		name: "Fund Campaign Created",
		title: "Fund Campaign Created",
		body: "A new fund campaign has been created: {campaignName}",
	},
	{
		eventType: "fund_campaign_pledge_created",
		channelType: "in_app",
		name: "Fund Campaign Pledge Created",
		title: "Fund Campaign Pledge Created",
		body: "A new pledge has been created: {pledgeAmount}",
	},
	{
		eventType: "post_created",
		channelType: "in_app",
		name: "Post Created",
		title: "Post Created",
		body: "A new post has been created: {postCaption}",
	},
	{
		eventType: "membership_request_accepted",
		channelType: "email",
		name: "Membership Request Accepted",
		title: "Membership Request Accepted",
		body: "Your membership request has been accepted for {organizationName}",
	},
	{
		eventType: "event_created",
		channelType: "in_app",
		name: "Event Created",
		title: "Event Created",
		body: "A new event has been created: {eventName}",
	},
	{
		eventType: "new_member_joined",
		channelType: "in_app",
		name: "New Member Joined",
		title: "New Member Joined",
		body: "{userName} has joined {organizationName}",
	},
	{
		eventType: "membership_request_rejected",
		channelType: "email",
		name: "Membership Request Rejected",
		title: "Membership Request Rejected",
		body: "Your membership request has been rejected for {organizationName}",
	},
] as const;

/**
 * Ensures common notification templates exist in the test database.
 * This prevents "No notification template found" errors during tests.
 * Call this function in test setup or beforeAll hooks.
 */
export async function ensureCommonNotificationTemplates(): Promise<void> {
	await server.drizzleClient.transaction(async (tx) => {
		for (const template of COMMON_NOTIFICATION_TEMPLATES) {
			const existing = await tx.query.notificationTemplatesTable.findFirst({
				where: (fields, operators) =>
					and(
						operators.eq(fields.eventType, template.eventType),
						operators.eq(fields.channelType, template.channelType),
					),
			});

			if (!existing) {
				await tx.insert(notificationTemplatesTable).values({
					name: template.name,
					eventType: template.eventType,
					title: template.title,
					body: template.body,
					channelType: template.channelType,
					linkedRouteName: null,
				});
			}
		}
	});
}
