/**
 * Minimal server shape required to resolve the admin user by email.
 * Tests pass the same server instance from test/server.ts.
 * drizzleClient is unknown so the real Fastify server is assignable; we cast at call site.
 */
export interface ServerWithAdminEnv {
	drizzleClient: unknown;
	envConfig: {
		API_ADMINISTRATOR_USER_EMAIL_ADDRESS: string;
	};
}

/** Shape we use to call findFirst; avoids any and satisfies disable-statements check. */
type UsersTableFindFirst = (opts: {
	columns: { id: true; emailAddress: true };
	where: (
		fields: { emailAddress: string },
		operators: { eq: (a: unknown, b: unknown) => unknown },
	) => unknown;
}) => Promise<{ id: string; emailAddress: string } | undefined>;

/**
 * Looks up the administrator user by email (from env) in the database.
 * Used by the test-only token mint path when TEST_BYPASS_REST_SIGNIN is set.
 * The admin is normally created by seedInitialData at server startup using the same env vars.
 *
 * @param server - Server instance with drizzleClient and envConfig (admin email). Typically the shared test server from test/server.ts.
 * @returns Promise resolving to { id, email } for the admin user.
 * @throws If no user is found with the configured admin email (admin must be seeded).
 */
export async function getOrCreateAdminUserId(
	server: ServerWithAdminEnv,
): Promise<{ id: string; email: string }> {
	const findFirst = (
		server.drizzleClient as {
			query: { usersTable: { findFirst: UsersTableFindFirst } };
		}
	).query.usersTable.findFirst;
	const row = await findFirst({
		columns: {
			id: true,
			emailAddress: true,
		},
		where: (
			fields: { emailAddress: string },
			operators: { eq: (a: unknown, b: unknown) => unknown },
		) =>
			operators.eq(
				fields.emailAddress,
				server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
			),
	});

	if (!row) {
		throw new Error(
			`Admin user not found for email ${server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS}. ` +
				"Ensure the test server has run seedInitialData (or equivalent) so the administrator user exists.",
		);
	}

	return {
		id: row.id,
		email: row.emailAddress,
	};
}
