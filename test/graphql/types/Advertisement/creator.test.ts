import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Advertisement as AdvertisementType } from "~/src/graphql/types/Advertisement/Advertisement";
import type { User } from "~/src/graphql/types/User/User";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { resolveCreator } from "../../../../src/graphql/types/Advertisement/Advertisement";

interface TestContext {
	currentClient: {
		isAuthenticated: boolean;
		user: {
			id: string;
			isAdmin: boolean;
		};
	};
	drizzleClient: {
		query: {
			usersTable: {
				findFirst: ReturnType<typeof vi.fn>;
			};
		};
	};
	log: {
		error: ReturnType<typeof vi.fn>;
	};
}

// Define user type for testing
interface UserType extends Pick<User, "id"> {
	role: string;
	organizationMembershipsWhereMember: Array<{
		role: string;
		organizationId?: string;
	}>;
}

describe("Advertisement Resolver - Creator Field", () => {
	let ctx: TestContext;
	let mockUser: UserType;
	let mockAdvertisement: AdvertisementType;

	beforeEach(() => {
		mockUser = {
			id: "123",
			role: "member",
			organizationMembershipsWhereMember: [{ role: "member" }],
		};

		mockAdvertisement = {
			id: "advert-123",
			name: "Test Advertisement",
			createdAt: new Date(),
			updatedAt: null,
			creatorId: "123",
			updaterId: null,
			description: "Test description",
			endAt: new Date(),
			startAt: new Date(),
			type: "banner",
			organizationId: "org-123",
			attachments: [],
		};

		ctx = {
			currentClient: {
				isAuthenticated: true,
				user: { id: "123", isAdmin: false },
			},
			drizzleClient: {
				query: {
					usersTable: {
						findFirst: vi.fn(),
					},
				},
			},
			log: {
				error: vi.fn(),
			},
		};
	});

	it("should throw unauthenticated error if the user is not logged in", async () => {
		ctx.currentClient.isAuthenticated = false;

		await expect(async () => {
			await resolveCreator(mockAdvertisement, {}, ctx);
		}).rejects.toThrow(
			new TalawaGraphQLError({
				message: "User is not authenticated",
				extensions: { code: "unauthenticated" },
			}),
		);
	});

	it("should throw unauthorized error if the user is not an administrator", async () => {
		// Mock a different user from the logged-in user
		const differentUser = {
			...mockUser,
			id: "456", // Match the creatorId we're testing
		};

		ctx.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
			differentUser,
		);
		ctx.currentClient.user.isAdmin = false; // Explicitly set non-admin

		await expect(async () => {
			await resolveCreator(
				{
					...mockAdvertisement,
					creatorId: "456", // Different from logged-in user's ID
				},
				{},
				ctx,
			);
		}).rejects.toThrow(
			new TalawaGraphQLError({
				message: "User is not authorized",
				extensions: { code: "unauthorized_action" },
			}),
		);
	});

	it("should allow access if user is organization admin", async () => {
		// Mock admin user
		const adminUser = {
			...mockUser,
			organizationMembershipsWhereMember: [
				{
					role: "administrator",
					organizationId: mockAdvertisement.organizationId,
				},
			],
		};

		ctx.drizzleClient.query.usersTable.findFirst
			.mockResolvedValueOnce(adminUser)
			.mockResolvedValueOnce({ id: "123" });

		const result = await resolveCreator(
			{ ...mockAdvertisement, creatorId: "123" },
			{},
			ctx,
		);

		expect(result.id).toBe("123");
	});

	it("should allow access to own advertisement", async () => {
		ctx.drizzleClient.query.usersTable.findFirst
			.mockResolvedValueOnce(mockUser)
			.mockResolvedValueOnce(mockUser);

		const result = await resolveCreator(
			{ ...mockAdvertisement, creatorId: "123" },
			{},
			ctx,
		);

		expect(result.id).toBe("123");
	});
});
