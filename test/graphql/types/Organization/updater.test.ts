import type { SQL } from "drizzle-orm";
import type { PgTableWithColumns } from "drizzle-orm/pg-core";
import type { FastifyBaseLogger } from "fastify";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { organizationsTable } from "~/src/drizzle/tables/organizations";
import type { usersTable } from "~/src/drizzle/tables/users"; // Import your actual users table
import type { GraphQLContext } from "~/src/graphql/context";
import type { Organization } from "~/src/graphql/types/Organization/Organization";
import type { User } from "~/src/graphql/types/User/User";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { createMockLogger } from "../../../utilities/mockLogger";

type Operators<T> = {
    eq: (field: T, value: T) => SQL;
  };

type DeepPartial<T> = {
	[P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
const OrganizationResolver = {
    updater: async (
      parent: Organization,
      _args: {},
      ctx: Omit<GraphQLContext, 'currentClient'> & {
        currentClient: {
          isAuthenticated: boolean;
          user: { id: string };
        };
        drizzleClient: {
          query: {
            usersTable: {
              findFirst: (params: {
                where: (
                  fields: typeof usersTable,
                  operators: Operators<typeof usersTable['id']>
                ) => SQL;
              }) => Promise<User | undefined>;
            };
          };
        };
      }
    ) => {
      if (!ctx.currentClient.isAuthenticated) {
        throw new TalawaGraphQLError({
          extensions: { code: "unauthenticated" },
        });
      }
  
      const currentUser = await ctx.drizzleClient.query.usersTable.findFirst({
        where: (
          fields: typeof usersTable, 
          operators: Operators<typeof usersTable['id']>
        ) => operators.eq(fields.id, ctx.currentClient.user.id),
      });

		if (!currentUser) {
			throw new TalawaGraphQLError({
				extensions: { code: "forbidden_action" },
			});
		}

		if (parent.updaterId === null) {
			return null;
		}

		if (parent.updaterId === currentUser.id) {
			return currentUser;
		}

		const updaterUser = await ctx.drizzleClient.query.usersTable.findFirst({
			where: (
				fields: PgTableWithColumns<any>,
				operators: { eq: (field: any, value: any) => SQL },
			) => operators.eq(fields.id, parent.updaterId),
		});

		if (!updaterUser) {
			ctx.log.warn(`No user found for updaterId: ${parent.updaterId}`);
			throw new TalawaGraphQLError({
				extensions: { code: "unexpected" },
			});
		}

		return updaterUser;
	},
};

type OrganizationType = typeof organizationsTable.$inferSelect;

interface TestContext extends Omit<GraphQLContext, "log" | "currentClient"> {
	log: FastifyBaseLogger;
	currentClient: {
		isAuthenticated: true;
		user: { id: string };
		token?: string;
	};
	drizzleClient: {
		query: {
			usersTable: {
				findFirst: ReturnType<typeof vi.fn>;
			};
			organizationsTable: {
				findFirst: ReturnType<typeof vi.fn>;
			};
		};
	} & GraphQLContext["drizzleClient"];

	jwt: any;
	pubsub: any;
}

describe("Organization Resolver - Updater Field", () => {
	let ctx: TestContext;
	let mockUser: DeepPartial<User>;
	let mockOrganization: DeepPartial<OrganizationType>;

	beforeEach(() => {
		mockUser = {
			id: "123",
			name: "John Doe",
			role: "administrator",
			createdAt: new Date(),
			updatedAt: null,
		};

		mockOrganization = {
			id: "org-123",
			name: "Test Organization",
			createdAt: new Date(),
			updaterId: "456",
			description: "Test description",
		};

		const mockLogger = createMockLogger();

		ctx = {
			drizzleClient: {
				query: {
					usersTable: {
						findFirst: vi.fn().mockResolvedValue(mockUser),
					},
					organizationsTable: {
						findFirst: vi.fn().mockResolvedValue(mockOrganization),
					},
				},
			} as unknown as TestContext["drizzleClient"],
			log: mockLogger,
			currentClient: {
				isAuthenticated: true,
				user: {
					id: "123",
				},
				token: "sample-token",
			},
			jwt: {},
			pubsub: {},
		} as TestContext;
	});

	it("should throw forbidden error when current user is not found", async () => {
		ctx.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
			undefined,
		);

		await expect(
			OrganizationResolver.updater(mockOrganization as any, {}, ctx as any),
		).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "forbidden_action" },
			}),
		);
	});

	it("should return null when  updaterId is null", async () => {
		const nullUpdaterOrganization = {
			...mockOrganization,
			updaterId: null,
		};

		const result = await OrganizationResolver.updater(
			nullUpdaterOrganization as any,
			{},
			ctx as any,
		);

		expect(result).toBeNull();
	});

	it("should return current user when updaterId matches current user", async () => {
		const currentUserOrganization = {
			...mockOrganization,
			updaterId: "123",
		};

		const result = await OrganizationResolver.updater(
			currentUserOrganization as any,
			{},
			ctx as any,
		);

		expect(result).toEqual(mockUser);
	});

	it("should throw error when updater user is not found", async () => {
		ctx.drizzleClient.query.usersTable.findFirst
			.mockResolvedValueOnce(mockUser)
			.mockResolvedValueOnce(undefined);

		const differentUpdaterOrganization = {
			...mockOrganization,
			updaterId: "non-existent-id",
		};

		await expect(
			OrganizationResolver.updater(
				differentUpdaterOrganization as any,
				{},
				ctx as any,
			),
		).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unexpected" },
			}),
		);

		expect(ctx.log.warn).toHaveBeenCalledWith(
			`No user found for updaterId: ${differentUpdaterOrganization.updaterId}`,
		);
	});

	it("should handle database errors gracefully", async () => {
		const dbError = new Error("Database connection failed");

		ctx.drizzleClient.query.usersTable.findFirst.mockRejectedValue(dbError);

		await expect(
			OrganizationResolver.updater(mockOrganization as any, {}, ctx as any),
		).rejects.toThrow(dbError);
	});
	it("should handle case updaterId comparison", async () => {
		const caseInsensitiveOrganization = {
			...mockOrganization,
			updaterId: "123",
		};

		const result = await OrganizationResolver.updater(
			caseInsensitiveOrganization as any,
			{},
			ctx as any,
		);

		expect(result).toEqual(mockUser);
	});
});
