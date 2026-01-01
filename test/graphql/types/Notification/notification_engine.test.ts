import { afterEach, describe, expect, test, vi } from "vitest";
import { emailNotificationsTable } from "~/src/drizzle/tables/EmailNotification";
import { notificationAudienceTable } from "~/src/drizzle/tables/NotificationAudience";
import { notificationLogsTable } from "~/src/drizzle/tables/NotificationLog";
import type { GraphQLContext } from "~/src/graphql/context";
import {
	NotificationChannelType,
	NotificationEngine,
	NotificationTargetType,
} from "~/src/graphql/types/Notification/Notification_engine";

// Unit Tests for NotificationEngine
describe("NotificationEngine (unit tests)", () => {
	function createMockTemplate(
		overrides: Partial<Record<string, unknown>> = {},
	) {
		return {
			id: overrides.id ?? "tpl_001",
			title: overrides.title ?? "Hello {name}",
			body: overrides.body ?? "Body for {name} - {message}",
			linkedRouteName: overrides.linkedRouteName ?? null,
			eventType: overrides.eventType ?? "test_event",
			channelType: overrides.channelType ?? "in_app",
			...overrides,
		};
	}

	function createMockContext(
		options: {
			template?: Record<string, unknown>;
			currentClient?: GraphQLContext["currentClient"];
			orgMembers?: Record<string, unknown>[];
			users?: Record<string, unknown>[];
		} = {},
	) {
		const template = options.template ?? createMockTemplate();
		interface InsertRecord {
			[k: string]: unknown;
		}
		const inserts: Array<{ table: string; values: InsertRecord[] }> = [];

		// simulate simple where filtering function for mocks
		type PredicateFn = (row: InsertRecord) => boolean;
		type WhereBuilder = (
			fields: Record<string, unknown>,
			ops: Record<string, unknown>,
		) => { test: PredicateFn } | unknown;
		const buildPredicate = (whereFn: WhereBuilder): PredicateFn | null => {
			const conditions: {
				field: string;
				value: unknown;
				isInArray?: boolean;
			}[] = [];

			const fieldProxy = new Proxy(
				{},
				{
					get(_target, prop) {
						return { _col: prop };
					},
				},
			) as Record<string, { _col: string }>;

			// Create the and function for complex queries
			const and = (..._args: unknown[]) => {
				return {
					test: (row: InsertRecord) => {
						return conditions.every(({ field, value, isInArray }) => {
							if (isInArray) {
								const matches =
									Array.isArray(value) && value.includes(row[field] as never);
								return matches;
							}
							const matches = row[field] === value;
							return matches;
						});
					},
				};
			};

			const ops = {
				eq: (f: { _col: string }, v: unknown) => {
					conditions.push({ field: f._col, value: v });
					return {
						_isEq: true,
						_field: f._col,
						_value: v,
					};
				},
				inArray: (f: { _col: string }, arr: unknown[]) => {
					conditions.push({ field: f._col, value: arr, isInArray: true });
					return {
						_isInArray: true,
						_field: f._col,
						_values: arr,
					};
				},
				and,
			};

			const predObj = whereFn(
				fieldProxy,
				ops as unknown as Record<string, unknown>,
			);

			if (predObj && typeof predObj === "object" && "test" in predObj) {
				return predObj.test as PredicateFn;
			}

			return (row: InsertRecord) => {
				return conditions.every(({ field, value, isInArray }) => {
					if (isInArray) {
						return Array.isArray(value) && value.includes(row[field] as never);
					}
					return row[field] === value;
				});
			};
		};
		let logIdCounter = 1;
		function makeInsert(tableName: string) {
			return {
				values(rawVals: InsertRecord[] | InsertRecord) {
					const arr = Array.isArray(rawVals) ? [...rawVals] : [rawVals];
					const withIds =
						tableName === "notificationLogsTable"
							? arr.map((v) => ({ id: `log_${logIdCounter++}`, ...v }))
							: arr;
					inserts.push({ table: tableName, values: withIds });
					return {
						returning() {
							if (tableName === "notificationLogsTable")
								return Promise.resolve(withIds);
							return Promise.resolve([]);
						},
					};
				},
			};
		}

		const ctx = {
			currentClient: options.currentClient ?? {
				isAuthenticated: true,
				user: { id: "sender_123" },
			},
			drizzleClient: {
				query: {
					notificationTemplatesTable: {
						findFirst: vi
							.fn()
							.mockImplementation((args?: { where?: WhereBuilder }) => {
								if (!args?.where) return Promise.resolve(template);
								const pred = buildPredicate(args.where);
								const result = pred?.(template);
								return Promise.resolve(result ? template : undefined);
							}),
					},
					organizationMembershipsTable: {
						findMany: vi
							.fn()
							.mockImplementation((args?: { where?: WhereBuilder }) => {
								const data = options.orgMembers ?? [];
								if (!args?.where) return Promise.resolve(data);
								const pred = buildPredicate(args.where);
								return Promise.resolve(
									pred ? data.filter((r) => pred(r)) : data,
								);
							}),
					},
					usersTable: {
						findMany: vi
							.fn()
							.mockImplementation(
								(args?: {
									where?: WhereBuilder;
									columns?: Record<string, boolean>;
								}) => {
									let data: InsertRecord[] = options.users ?? [];
									if (args?.where) {
										const pred = buildPredicate(args.where);
										if (pred) data = data.filter((r) => pred(r));
									}
									if (args?.columns) {
										const cols = args.columns;
										data = data.map((r) => {
											const o: InsertRecord = {};
											for (const key of Object.keys(cols)) {
												if (cols[key]) o[key] = r[key];
											}
											return o;
										});
									}
									return Promise.resolve(data);
								},
							),
					},
				},
				insert: (table: unknown) => {
					if (table === notificationLogsTable) {
						return makeInsert("notificationLogsTable");
					}
					if (table === notificationAudienceTable) {
						return makeInsert("notificationAudienceTable");
					}
					if (table === emailNotificationsTable) {
						return makeInsert("emailNotificationsTable");
					}
					return makeInsert("unknown");
				},
			},
			log: {
				info: vi.fn(),
				warn: vi.fn(),
			},
			envConfig: { API_BASE_URL: "http://localhost" },
			jwt: { sign: () => "test_token" },
			minio: {},
			pubsub: {},
		} as unknown as GraphQLContext;

		return { ctx, inserts, template };
	}

	afterEach(() => {
		vi.restoreAllMocks();
	});

	test("throws error when template not found", async () => {
		const { ctx } = createMockContext();
		(
			ctx.drizzleClient.query.notificationTemplatesTable
				.findFirst as ReturnType<typeof vi.fn>
		).mockResolvedValueOnce(undefined);

		const engine = new NotificationEngine(ctx);

		await expect(
			engine.createNotification(
				"non_existent_event",
				{ name: "Alice" },
				{ targetType: NotificationTargetType.USER, targetIds: ["user_001"] },
			),
		).rejects.toThrow(
			"No associated resources found for the provided arguments.",
		);
	});

	test("creates in-app notification for USER target, excluding sender", async () => {
		const { ctx, inserts } = createMockContext({
			template: createMockTemplate({
				eventType: "test_event",
				channelType: "in_app",
			}),
		});
		const engine = new NotificationEngine(ctx);

		await engine.createNotification(
			"test_event",
			{ name: "Bob" },
			{
				targetType: NotificationTargetType.USER,
				targetIds: ["sender_123", "user_456"],
			},
		);

		const logInsert = inserts.find((i) => i.table === "notificationLogsTable");
		expect(logInsert?.values).toHaveLength(1);
		expect(logInsert?.values[0]).toMatchObject({
			eventType: "test_event",
			channel: "in_app",
			status: "delivered",
		});

		const audienceInsert = inserts.find(
			(i) => i.table === "notificationAudienceTable",
		);
		expect(audienceInsert?.values).toEqual([
			expect.objectContaining({ userId: "user_456", isRead: false }),
		]);
	});

	test("resolves ORGANIZATION target to organization members", async () => {
		const mockMembers = [
			{ memberId: "member_001", organizationId: "org_001" },
			{ memberId: "member_002", organizationId: "org_001" },
			{ memberId: "sender_123", organizationId: "org_001" },
		];

		const { ctx, inserts } = createMockContext({
			orgMembers: mockMembers,
			template: createMockTemplate({
				eventType: "org_event",
				channelType: "in_app",
			}),
		});
		const engine = new NotificationEngine(ctx);

		await engine.createNotification(
			"org_event",
			{},
			{
				targetType: NotificationTargetType.ORGANIZATION,
				targetIds: ["org_001"],
			},
		);

		expect(
			ctx.drizzleClient.query.organizationMembershipsTable.findMany,
		).toHaveBeenCalled();

		const audienceInsert = inserts.find(
			(i) => i.table === "notificationAudienceTable",
		);
		expect(audienceInsert?.values).toEqual([
			expect.objectContaining({ userId: "member_001" }),
			expect.objectContaining({ userId: "member_002" }),
		]);
	});

	test("resolves ORGANIZATION_ADMIN target to admin members only", async () => {
		const mockMembers = [
			{
				memberId: "admin_001",
				role: "administrator",
				organizationId: "org_001",
			},
			{ memberId: "regular_001", role: "regular", organizationId: "org_001" },
			{
				memberId: "sender_123",
				role: "administrator",
				organizationId: "org_001",
			},
		];

		const { ctx, inserts } = createMockContext({
			orgMembers: mockMembers,
			template: createMockTemplate({
				eventType: "admin_event",
				channelType: "in_app",
			}),
		});
		const engine = new NotificationEngine(ctx);

		await engine.createNotification(
			"admin_event",
			{},
			{
				targetType: NotificationTargetType.ORGANIZATION_ADMIN,
				targetIds: ["org_001"],
			},
		);

		const audienceInsert = inserts.find(
			(i) => i.table === "notificationAudienceTable",
		);
		expect(audienceInsert?.values).toEqual([
			expect.objectContaining({ userId: "admin_001" }),
		]);
	});

	test("resolves ADMIN target to global administrators", async () => {
		const mockUsers = [
			{ id: "global_admin_001", role: "administrator" },
			{ id: "global_admin_002", role: "administrator" },
			{ id: "sender_123", role: "administrator" },
		];

		const { ctx, inserts } = createMockContext({
			users: mockUsers,
			template: createMockTemplate({
				eventType: "global_admin_event",
				channelType: "in_app",
			}),
		});
		const engine = new NotificationEngine(ctx);

		await engine.createNotification(
			"global_admin_event",
			{},
			{ targetType: NotificationTargetType.ADMIN, targetIds: [] },
		);

		const audienceInsert = inserts.find(
			(i) => i.table === "notificationAudienceTable",
		);
		expect(audienceInsert?.values).toEqual([
			expect.objectContaining({ userId: "global_admin_001" }),
			expect.objectContaining({ userId: "global_admin_002" }),
		]);
	});

	test("creates email notifications with deduplication and sender exclusion", async () => {
		const mockUsers = [
			{ id: "user_001", emailAddress: "user1@example.com" },
			{ id: "user_002", emailAddress: "user2@example.com" },
			{ id: "sender_123", emailAddress: "sender@example.com" },
		];

		const { ctx, inserts } = createMockContext({
			users: mockUsers,
			template: createMockTemplate({
				eventType: "email_event",
				channelType: "email",
			}),
		});
		const engine = new NotificationEngine(ctx);

		await engine.createNotification(
			"email_event",
			{ message: "Test email" },
			[
				{
					targetType: NotificationTargetType.USER,
					targetIds: ["user_001", "user_002"],
				},
				{
					targetType: NotificationTargetType.USER,
					targetIds: ["user_002", "sender_123"],
				},
			],
			NotificationChannelType.EMAIL,
		);

		const emailInsert = inserts.find(
			(i) => i.table === "emailNotificationsTable",
		);
		expect(emailInsert?.values).toHaveLength(2);

		const userIds = emailInsert?.values.map((v) => v.userId as string).sort();
		expect(userIds).toEqual(["user_001", "user_002"]);
	});

	test("warns when no email recipients found", async () => {
		const { ctx, inserts } = createMockContext({
			users: [],
			template: createMockTemplate({
				eventType: "email_event",
				channelType: "email",
			}),
		});
		const engine = new NotificationEngine(ctx);

		await engine.createNotification(
			"email_event",
			{},
			{
				targetType: NotificationTargetType.USER,
				targetIds: ["nonexistent_user"],
			},
			NotificationChannelType.EMAIL,
		);

		const emailInsert = inserts.find(
			(i) => i.table === "emailNotificationsTable",
		);
		expect(emailInsert).toBeUndefined();

		expect(ctx.log.warn).toHaveBeenCalled();
	});

	test("renders template variables correctly", async () => {
		const template = createMockTemplate({
			eventType: "test_event",
			channelType: "in_app",
			title: "Hello {name}!",
			body: "Welcome {name}, you have {count} new messages.",
		});

		const { ctx, inserts } = createMockContext({ template });
		const engine = new NotificationEngine(ctx);

		await engine.createNotification(
			"test_event",
			{ name: "Alice", count: 5 },
			{ targetType: NotificationTargetType.USER, targetIds: ["user_001"] },
		);

		const logInsert = inserts.find((i) => i.table === "notificationLogsTable");
		expect(logInsert?.values?.[0]?.renderedContent).toEqual({
			title: "Hello Alice!",
			body: "Welcome Alice, you have 5 new messages.",
		});
	});

	test("handles multiple audience specifications", async () => {
		const mockMembers = [
			{ memberId: "org_member_001", organizationId: "org_001" },
		];
		const mockUsers = [{ id: "global_admin_001", role: "administrator" }];

		const { ctx, inserts } = createMockContext({
			orgMembers: mockMembers,
			users: mockUsers,
			template: createMockTemplate({
				eventType: "multi_audience_event",
				channelType: "in_app",
			}),
		});
		const engine = new NotificationEngine(ctx);

		await engine.createNotification("multi_audience_event", {}, [
			{
				targetType: NotificationTargetType.ORGANIZATION,
				targetIds: ["org_001"],
			},
			{ targetType: NotificationTargetType.ADMIN, targetIds: [] },
			{
				targetType: NotificationTargetType.USER,
				targetIds: ["direct_user_001"],
			},
		]);

		const audienceInserts = inserts.filter(
			(i) => i.table === "notificationAudienceTable",
		);

		const allValues = audienceInserts.flatMap((insert) => insert.values);
		expect(allValues).toHaveLength(3);

		const userIds = allValues.map((v) => v.userId as string).sort();
		expect(userIds).toEqual([
			"direct_user_001",
			"global_admin_001",
			"org_member_001",
		]);
	});

	test("does not exclude sender when unauthenticated", async () => {
		const { ctx, inserts } = createMockContext({
			currentClient: {
				isAuthenticated: false,
			} as GraphQLContext["currentClient"],
			template: createMockTemplate({
				eventType: "guest_event",
				channelType: "in_app",
			}),
		});
		const engine = new NotificationEngine(ctx);

		await engine.createNotification(
			"guest_event",
			{},
			{
				targetType: NotificationTargetType.USER,
				targetIds: ["guest_user", "other_user"],
			},
		);

		const audienceInsert = inserts.find(
			(i) => i.table === "notificationAudienceTable",
		);
		expect(audienceInsert?.values).toHaveLength(2);

		const userIds = audienceInsert?.values
			.map((v) => v.userId as string)
			.sort();
		expect(userIds).toEqual(["guest_user", "other_user"]);
	});

	test("handles users with empty or null email addresses (line 169-171 coverage)", async () => {
		const mockUsers = [
			{ id: "user_001", emailAddress: "" },
			{ id: "user_002", emailAddress: null },
			{ id: "user_003", emailAddress: "   " },
		];

		const { ctx, inserts } = createMockContext({
			users: mockUsers,
			template: createMockTemplate({
				eventType: "email_event",
				channelType: "email",
			}),
		});
		const engine = new NotificationEngine(ctx);

		await engine.createNotification(
			"email_event",
			{ message: "Test email" },
			{
				targetType: NotificationTargetType.USER,
				targetIds: ["user_001", "user_002", "user_003"],
			},
			NotificationChannelType.EMAIL,
		);

		const emailInsert = inserts.find(
			(i) => i.table === "emailNotificationsTable",
		);
		expect(emailInsert).toBeUndefined();

		expect(ctx.log.warn).toHaveBeenCalledWith(
			"No users found with valid email addresses",
		);
	});

	test("covers resolveAudienceToUserIds with empty organization ID (line 230-272 coverage)", async () => {
		const { ctx, inserts } = createMockContext({
			template: createMockTemplate({
				eventType: "org_event",
				channelType: "in_app",
			}),
		});
		const engine = new NotificationEngine(ctx);

		await engine.createNotification(
			"org_event",
			{},
			{
				targetType: NotificationTargetType.ORGANIZATION_ADMIN,
				targetIds: [],
			},
		);

		const audienceInsert = inserts.find(
			(i) => i.table === "notificationAudienceTable",
		);
		expect(audienceInsert).toBeUndefined();
	});

	test("covers resolveAudienceToUserIds ORGANIZATION path with empty targetIds (line 230-272 coverage)", async () => {
		const { ctx, inserts } = createMockContext({
			template: createMockTemplate({
				eventType: "org_event",
				channelType: "in_app",
			}),
		});
		const engine = new NotificationEngine(ctx);

		await engine.createNotification(
			"org_event",
			{},
			{
				targetType: NotificationTargetType.ORGANIZATION,
				targetIds: [],
			},
		);

		const audienceInsert = inserts.find(
			(i) => i.table === "notificationAudienceTable",
		);
		expect(audienceInsert).toBeUndefined();
	});

	test("covers createAudienceEntries with empty organization ID (line 230-272 coverage)", async () => {
		const { ctx, inserts } = createMockContext({
			template: createMockTemplate({
				eventType: "org_admin_event",
				channelType: "in_app",
			}),
		});
		const engine = new NotificationEngine(ctx);

		await engine.createNotification(
			"org_admin_event",
			{},
			{
				targetType: NotificationTargetType.ORGANIZATION_ADMIN,
				targetIds: [],
			},
		);

		const audienceInsert = inserts.find(
			(i) => i.table === "notificationAudienceTable",
		);
		expect(audienceInsert).toBeUndefined();
	});

	test("covers createAudienceEntries ORGANIZATION path with empty targetIds (line 230-272 coverage)", async () => {
		const { ctx, inserts } = createMockContext({
			template: createMockTemplate({
				eventType: "org_event",
				channelType: "in_app",
			}),
		});
		const engine = new NotificationEngine(ctx);

		await engine.createNotification(
			"org_event",
			{},
			{
				targetType: NotificationTargetType.ORGANIZATION,
				targetIds: [],
			},
		);

		const audienceInsert = inserts.find(
			(i) => i.table === "notificationAudienceTable",
		);
		expect(audienceInsert).toBeUndefined();
	});

	test("covers template variable rendering with null and undefined values", async () => {
		const template = createMockTemplate({
			eventType: "test_event",
			channelType: "in_app",
			title: "Hello {name}! Welcome {greeting}",
			body: "Message: {message}, Count: {count}, Status: {status}",
		});

		const { ctx, inserts } = createMockContext({ template });
		const engine = new NotificationEngine(ctx);

		await engine.createNotification(
			"test_event",
			{
				name: "Alice",
				greeting: null,
				message: undefined,
				count: 0,
				status: "",
			},
			{ targetType: NotificationTargetType.USER, targetIds: ["user_001"] },
		);

		const logInsert = inserts.find((i) => i.table === "notificationLogsTable");
		expect(logInsert?.values?.[0]?.renderedContent).toEqual({
			title: "Hello Alice! Welcome {greeting}",
			body: "Message: {message}, Count: 0, Status: ",
		});
	});

	describe("Additional tests for lines 229-271 (resolveAudienceToUserIds)", () => {
		test("covers ORGANIZATION_ADMIN target with undefined orgId", async () => {
			const mockMembers = [
				{
					memberId: "admin_001",
					role: "administrator",
					organizationId: "org_001",
				},
			];

			const { ctx, inserts } = createMockContext({
				orgMembers: mockMembers,
				template: createMockTemplate({
					eventType: "admin_event",
					channelType: "in_app",
				}),
			});
			const engine = new NotificationEngine(ctx);

			await engine.createNotification(
				"admin_event",
				{},
				{
					targetType: NotificationTargetType.ORGANIZATION_ADMIN,
					targetIds: [undefined as unknown as string],
				},
			);

			const audienceInsert = inserts.find(
				(i) => i.table === "notificationAudienceTable",
			);
			expect(audienceInsert).toBeUndefined();
		});

		test("covers ORGANIZATION target with null orgId", async () => {
			const mockMembers = [
				{ memberId: "member_001", organizationId: "org_001" },
			];

			const { ctx, inserts } = createMockContext({
				orgMembers: mockMembers,
				template: createMockTemplate({
					eventType: "org_event",
					channelType: "in_app",
				}),
			});
			const engine = new NotificationEngine(ctx);

			await engine.createNotification(
				"org_event",
				{},
				{
					targetType: NotificationTargetType.ORGANIZATION,
					targetIds: [null as unknown as string],
				},
			);

			const audienceInsert = inserts.find(
				(i) => i.table === "notificationAudienceTable",
			);
			expect(audienceInsert).toBeUndefined();
		});

		test("covers ORGANIZATION_ADMIN with no administrator members", async () => {
			const mockMembers = [
				{ memberId: "regular_001", role: "regular", organizationId: "org_001" },
				{ memberId: "regular_002", role: "member", organizationId: "org_001" },
			];

			const { ctx, inserts } = createMockContext({
				orgMembers: mockMembers,
				template: createMockTemplate({
					eventType: "admin_event",
					channelType: "in_app",
				}),
			});
			const engine = new NotificationEngine(ctx);

			await engine.createNotification(
				"admin_event",
				{},
				{
					targetType: NotificationTargetType.ORGANIZATION_ADMIN,
					targetIds: ["org_001"],
				},
			);

			const audienceInsert = inserts.find(
				(i) => i.table === "notificationAudienceTable",
			);
			expect(audienceInsert).toBeUndefined();
		});

		test("covers ADMIN target with no administrator users", async () => {
			const mockUsers = [
				{ id: "regular_001", role: "user" },
				{ id: "regular_002", role: "member" },
			];

			const { ctx, inserts } = createMockContext({
				users: mockUsers,
				template: createMockTemplate({
					eventType: "global_admin_event",
					channelType: "in_app",
				}),
			});
			const engine = new NotificationEngine(ctx);

			await engine.createNotification(
				"global_admin_event",
				{},
				{ targetType: NotificationTargetType.ADMIN, targetIds: [] },
			);

			const audienceInsert = inserts.find(
				(i) => i.table === "notificationAudienceTable",
			);
			expect(audienceInsert).toBeUndefined();
		});

		test("covers USER target with all IDs being sender (should filter out all)", async () => {
			const { ctx, inserts } = createMockContext({
				template: createMockTemplate({
					eventType: "self_event",
					channelType: "in_app",
				}),
			});
			const engine = new NotificationEngine(ctx);

			await engine.createNotification(
				"self_event",
				{},
				{
					targetType: NotificationTargetType.USER,
					targetIds: ["sender_123", "sender_123"],
				},
			);

			const audienceInsert = inserts.find(
				(i) => i.table === "notificationAudienceTable",
			);
			expect(audienceInsert).toBeUndefined();
		});
	});

	describe("Additional tests for lines 385-456 (createDirectEmailNotification)", () => {
		test("covers createDirectEmailNotification with single email recipient", async () => {
			const template = createMockTemplate({
				eventType: "event_invite",
				channelType: "email",
				title: "Event Invitation: {eventName}",
				body: "You are invited to {eventName}",
			});

			const { ctx, inserts } = createMockContext({ template });
			const engine = new NotificationEngine(ctx);

			const notificationId = await engine.createDirectEmailNotification(
				"event_invite",
				{ eventName: "Annual Conference" },
				"invitee@example.com",
			);

			const logInsert = inserts.find(
				(i) => i.table === "notificationLogsTable",
			);
			expect(logInsert?.values).toHaveLength(1);
			expect(logInsert?.values[0]).toMatchObject({
				eventType: "event_invite",
				channel: "email",
				status: "pending",
			});

			const emailInsert = inserts.find(
				(i) => i.table === "emailNotificationsTable",
			);
			expect(emailInsert?.values).toHaveLength(1);
			expect(emailInsert?.values[0]).toMatchObject({
				userId: null,
				email: "invitee@example.com",
				subject: "Event Invitation: Annual Conference",
				htmlBody: "You are invited to Annual Conference",
				status: "pending",
				retryCount: 0,
				maxRetries: 3,
			});

			expect(notificationId).toBeDefined();
			expect(typeof notificationId).toBe("string");
		});

		test("covers createDirectEmailNotification with multiple email recipients", async () => {
			const template = createMockTemplate({
				eventType: "event_invite",
				channelType: "email",
				title: "Event Invitation: {eventName}",
				body: "You are invited to {eventName}",
			});

			const { ctx, inserts } = createMockContext({ template });
			const engine = new NotificationEngine(ctx);

			const notificationId = await engine.createDirectEmailNotification(
				"event_invite",
				{ eventName: "Annual Conference" },
				[
					"invitee1@example.com",
					"invitee2@example.com",
					"invitee3@example.com",
				],
			);

			const logInsert = inserts.find(
				(i) => i.table === "notificationLogsTable",
			);
			expect(logInsert?.values).toHaveLength(1);

			const emailInsert = inserts.find(
				(i) => i.table === "emailNotificationsTable",
			);
			expect(emailInsert?.values).toHaveLength(3);

			const emails = emailInsert?.values.map((v) => v.email as string).sort();
			expect(emails).toEqual([
				"invitee1@example.com",
				"invitee2@example.com",
				"invitee3@example.com",
			]);

			expect(notificationId).toBeDefined();
			expect(typeof notificationId).toBe("string");
		});

		test("covers createDirectEmailNotification template not found error", async () => {
			const { ctx } = createMockContext();
			(
				ctx.drizzleClient.query.notificationTemplatesTable
					.findFirst as ReturnType<typeof vi.fn>
			).mockResolvedValueOnce(undefined);

			const engine = new NotificationEngine(ctx);

			await expect(
				engine.createDirectEmailNotification(
					"non_existent_event",
					{ eventName: "Test Event" },
					"test@example.com",
				),
			).rejects.toThrow(
				"No associated resources found for the provided arguments.",
			);
		});

		test("covers createDirectEmailNotification with unauthenticated sender", async () => {
			const template = createMockTemplate({
				eventType: "event_invite",
				channelType: "email",
				title: "Event Invitation: {eventName}",
				body: "You are invited to {eventName}",
			});

			const { ctx, inserts } = createMockContext({
				currentClient: {
					isAuthenticated: false,
				} as GraphQLContext["currentClient"],
				template,
			});
			const engine = new NotificationEngine(ctx);

			await engine.createDirectEmailNotification(
				"event_invite",
				{ eventName: "Annual Conference" },
				"invitee@example.com",
			);

			const logInsert = inserts.find(
				(i) => i.table === "notificationLogsTable",
			);
			expect(logInsert?.values[0]).toMatchObject({
				sender: null,
				eventType: "event_invite",
				channel: "email",
			});

			const emailInsert = inserts.find(
				(i) => i.table === "emailNotificationsTable",
			);
			expect(emailInsert?.values).toHaveLength(1);
			expect(emailInsert?.values[0]).toMatchObject({
				userId: null,
				email: "invitee@example.com",
			});
		});

		test("covers createDirectEmailNotification with complex template variables", async () => {
			const template = createMockTemplate({
				eventType: "event_invite",
				channelType: "email",
				title: "Invitation: {eventName} from {inviterName}",
				body: "Dear {inviteeName},\n\nYou are invited to {eventName} on {eventDate}.\n\nClick here: {invitationUrl}",
			});

			const { ctx, inserts } = createMockContext({ template });
			const engine = new NotificationEngine(ctx);

			await engine.createDirectEmailNotification(
				"event_invite",
				{
					eventName: "Annual Conference 2025",
					inviterName: "John Doe",
					inviteeName: "Jane Smith",
					eventDate: "December 15, 2025",
					invitationUrl: "https://example.com/event/123",
				},
				"jane@example.com",
			);
			const emailInsert = inserts.find(
				(i) => i.table === "emailNotificationsTable",
			);
			expect(emailInsert?.values[0]).toMatchObject({
				subject: "Invitation: Annual Conference 2025 from John Doe",
				htmlBody:
					"Dear Jane Smith,\n\nYou are invited to Annual Conference 2025 on December 15, 2025.\n\nClick here: https://example.com/event/123",
			});
		});

		test("covers createDirectEmailNotification with empty email array", async () => {
			const template = createMockTemplate({
				eventType: "event_invite",
				channelType: "email",
			});

			const { ctx, inserts } = createMockContext({ template });
			const engine = new NotificationEngine(ctx);

			await engine.createDirectEmailNotification(
				"event_invite",
				{ eventName: "Test Event" },
				[],
			);

			const logInsert = inserts.find(
				(i) => i.table === "notificationLogsTable",
			);
			expect(logInsert?.values).toHaveLength(1);

			const emailInsert = inserts.find(
				(i) => i.table === "emailNotificationsTable",
			);
			expect(emailInsert?.values).toHaveLength(0);
		});

		test("covers createDirectEmailNotification notification log creation failure", async () => {
			const template = createMockTemplate({
				eventType: "send_event_invite",
				channelType: "email",
				title: "Test Event Invite",
				body: "Test body",
			});

			const { ctx } = createMockContext({ template });

			const mockInsert = vi.fn().mockImplementation((table: unknown) => {
				if (table === notificationLogsTable) {
					return {
						values: vi.fn().mockReturnValue({
							returning: () => Promise.resolve([]),
						}),
					};
				}
				return {
					values: vi.fn().mockReturnValue({
						returning: () => Promise.resolve([]),
					}),
				};
			});

			ctx.drizzleClient.insert = mockInsert;

			const engine = new NotificationEngine(ctx);

			await expect(
				engine.createDirectEmailNotification(
					"send_event_invite",
					{ eventName: "Test Event" },
					"test@example.com",
				),
			).rejects.toThrow("Something went wrong. Please try again later.");
		});
	});
});
