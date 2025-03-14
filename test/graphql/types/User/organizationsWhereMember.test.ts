import { beforeEach, describe, expect, test, vi } from "vitest";
import type {
	ExplicitGraphQLContext,
	ImplicitMercuriusContext,
} from "~/src/graphql/context";
import type { Organization } from "~/src/graphql/types/Organization/Organization";
import type { User } from "~/src/graphql/types/User/User";
import { resolveOrganizationsWhereMember } from "~/src/graphql/types/User/organizationsWhereMember";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

type ContextType = ExplicitGraphQLContext & ImplicitMercuriusContext;

const defaultTestUser: User = {
	id: "defaultUserId",
	role: "administrator",
	addressLine1: null,
	name: "Test User",
	addressLine2: null,
	avatarMimeType: null,
	avatarName: null,
	createdAt: new Date(),
	updatedAt: new Date(),
	workPhoneNumber: null,
	birthDate: null,
	city: null,
	countryCode: null,
	creatorId: null,
	description: null,
	educationGrade: null,
	employmentStatus: null,
	emailAddress: "test@example.com",
	homePhoneNumber: null,
	isEmailAddressVerified: true,
	maritalStatus: null,
	mobilePhoneNumber: null,
	postalCode: null,
	state: null,
	natalSex: null,
	naturalLanguageCode: null,
	passwordHash: "dummyHash",
	updaterId: null,
};

function createTestUser(overrides?: Partial<User>): User {
	return { ...defaultTestUser, ...overrides };
}

const mockDrizzleClient = {
	select: vi.fn(),
	query: {
		usersTable: { findFirst: vi.fn() },
	},
};

const baseMockCtx: ContextType = {
	currentClient: {
		isAuthenticated: true,
		user: createTestUser({ id: "user123", role: "administrator" }),
	},
	drizzleClient: mockDrizzleClient,
	log: { error: vi.fn() },
} as unknown as ContextType;

const mockUserParent: User = createTestUser({
	id: "user123",
	role: "administrator",
});

const validConnectionArgs = {
	filter: undefined,
	limit: 10,
	isInversed: false,
	cursor: undefined,
	first: 10,
};

describe("resolveOrganizationsWhereMember", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test("throws an unauthenticated error if user is not authenticated", async () => {
		const unauthCtx = {
			...baseMockCtx,
			currentClient: { isAuthenticated: false },
		} as unknown as ContextType;

		await expect(
			resolveOrganizationsWhereMember(
				mockUserParent,
				validConnectionArgs,
				unauthCtx,
			),
		).rejects.toThrowError(
			expect.objectContaining({
				extensions: { code: "unauthenticated" },
			}),
		);
	});

	test("throws an unauthorized error if the current user (non-admin) is querying a different user", async () => {
		const differentParent: User = createTestUser({
			id: "user999",
			role: "regular",
		});
		const nonAdminCtx = {
			...baseMockCtx,
			currentClient: {
				isAuthenticated: true,
				user: createTestUser({ id: "user123", role: "regular" }),
			},
		} as unknown as ContextType;

		mockDrizzleClient.query.usersTable.findFirst.mockResolvedValue(
			createTestUser({ id: "user123", role: "regular" }),
		);

		await expect(
			resolveOrganizationsWhereMember(
				differentParent,
				validConnectionArgs,
				nonAdminCtx,
			),
		).rejects.toThrowError(
			expect.objectContaining({
				extensions: { code: "unauthorized_action" },
			}),
		);
	});
});
