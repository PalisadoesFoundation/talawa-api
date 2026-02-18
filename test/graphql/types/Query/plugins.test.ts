import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { afterEach, expect, suite, test, vi } from "vitest";
import { pluginsTable } from "~/src/drizzle/tables/plugins";
import type { TalawaGraphQLFormattedError } from "~/src/utilities/TalawaGraphQLError";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { Query_getPluginById, Query_getPlugins } from "../documentNodes";

const createdPluginIds: string[] = [];

async function insertPlugin(
	overrides: Partial<typeof pluginsTable.$inferInsert> = {},
) {
	const values = {
		pluginId: `plugin_${faker.string.ulid()}`,
		isActivated: false,
		isInstalled: false,
		backup: false,
		...overrides,
	};
	const [plugin] = await server.drizzleClient
		.insert(pluginsTable)
		.values(values)
		.returning();

	assertToBeNonNullish(plugin, "Failed to insert test plugin");
	createdPluginIds.push(plugin.id);
	return plugin;
}

afterEach(async () => {
	vi.restoreAllMocks();
	for (const id of createdPluginIds) {
		await server.drizzleClient
			.delete(pluginsTable)
			.where(eq(pluginsTable.id, id));
	}
	createdPluginIds.length = 0;
});

suite("Query field getPluginById", () => {
	test("returns a graphql error when an invalid (non-uuid) id is provided", async () => {
		const result = await mercuriusClient.query(Query_getPluginById, {
			variables: {
				input: {
					id: "not-a-valid-uuid",
				},
			},
		});

		expect(result.data.getPluginById).toEqual(null);
		expect(result.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining({
						code: "internal_server_error",
					}),
					message: "Invalid Plugin ID format",
					path: ["getPluginById"],
				}),
			]),
		);
	});

	test("returns null when the plugin with the given id does not exist", async () => {
		const result = await mercuriusClient.query(Query_getPluginById, {
			variables: {
				input: {
					id: faker.string.uuid(),
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data.getPluginById).toBeNull();
	});

	test("returns the plugin when it exists", async () => {
		const plugin = await insertPlugin({
			isActivated: true,
			isInstalled: true,
			backup: true,
		});

		const result = await mercuriusClient.query(Query_getPluginById, {
			variables: {
				input: {
					id: plugin.id,
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data.getPluginById).toMatchObject({
			id: plugin.id,
			pluginId: plugin.pluginId,
			isActivated: true,
			isInstalled: true,
			backup: true,
		});
		expect(result.data.getPluginById?.createdAt).toBeDefined();
	});
});

suite("Query field getPlugins", () => {
	test("returns all plugins when no input filter is provided", async () => {
		const plugin1 = await insertPlugin();
		const plugin2 = await insertPlugin();

		const result = await mercuriusClient.query(Query_getPlugins, {
			variables: {},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data.getPlugins).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ id: plugin1.id }),
				expect.objectContaining({ id: plugin2.id }),
			]),
		);
	});

	test("returns plugins filtered by pluginId", async () => {
		const targetPluginId = `target_${faker.string.ulid()}`;
		const targetPlugin = await insertPlugin({ pluginId: targetPluginId });
		const otherPlugin = await insertPlugin();

		const result = await mercuriusClient.query(Query_getPlugins, {
			variables: {
				input: {
					pluginId: targetPluginId,
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data.getPlugins).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					id: targetPlugin.id,
					pluginId: targetPluginId,
				}),
			]),
		);
		expect(result.data.getPlugins).toEqual(
			expect.not.arrayContaining([
				expect.objectContaining({ id: otherPlugin.id }),
			]),
		);
	});

	test("returns plugins filtered by isActivated", async () => {
		const activatedPlugin = await insertPlugin({ isActivated: true });
		const deactivatedPlugin = await insertPlugin({ isActivated: false });

		const result = await mercuriusClient.query(Query_getPlugins, {
			variables: {
				input: {
					isActivated: true,
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data.getPlugins).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ id: activatedPlugin.id }),
			]),
		);
		expect(result.data.getPlugins).toEqual(
			expect.not.arrayContaining([
				expect.objectContaining({ id: deactivatedPlugin.id }),
			]),
		);
	});

	test("returns plugins filtered by isInstalled", async () => {
		const installedPlugin = await insertPlugin({ isInstalled: true });
		const notInstalledPlugin = await insertPlugin({ isInstalled: false });

		const result = await mercuriusClient.query(Query_getPlugins, {
			variables: {
				input: {
					isInstalled: true,
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data.getPlugins).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ id: installedPlugin.id }),
			]),
		);
		expect(result.data.getPlugins).toEqual(
			expect.not.arrayContaining([
				expect.objectContaining({ id: notInstalledPlugin.id }),
			]),
		);
	});

	test("returns plugins filtered by multiple criteria", async () => {
		const matchingPlugin = await insertPlugin({
			isActivated: true,
			isInstalled: true,
		});
		const activatedOnlyPlugin = await insertPlugin({
			isActivated: true,
			isInstalled: false,
		});
		const installedOnlyPlugin = await insertPlugin({
			isActivated: false,
			isInstalled: true,
		});

		const result = await mercuriusClient.query(Query_getPlugins, {
			variables: {
				input: {
					isActivated: true,
					isInstalled: true,
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data.getPlugins).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ id: matchingPlugin.id }),
			]),
		);
		expect(result.data.getPlugins).toEqual(
			expect.not.arrayContaining([
				expect.objectContaining({ id: activatedOnlyPlugin.id }),
				expect.objectContaining({ id: installedOnlyPlugin.id }),
			]),
		);
	});

	test("returns an empty array when no plugins match the filter", async () => {
		const uniquePluginId = `nonexistent_${faker.string.ulid()}`;

		const result = await mercuriusClient.query(Query_getPlugins, {
			variables: {
				input: {
					pluginId: uniquePluginId,
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data.getPlugins).toEqual([]);
	});

	test("returns plugins filtered by isActivated set to false", async () => {
		const deactivatedPlugin = await insertPlugin({ isActivated: false });
		const activatedPlugin = await insertPlugin({ isActivated: true });

		const result = await mercuriusClient.query(Query_getPlugins, {
			variables: {
				input: {
					isActivated: false,
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data.getPlugins).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ id: deactivatedPlugin.id }),
			]),
		);
		expect(result.data.getPlugins).toEqual(
			expect.not.arrayContaining([
				expect.objectContaining({ id: activatedPlugin.id }),
			]),
		);
	});

	test("returns plugins filtered by isInstalled set to false", async () => {
		const notInstalledPlugin = await insertPlugin({ isInstalled: false });
		const installedPlugin = await insertPlugin({ isInstalled: true });

		const result = await mercuriusClient.query(Query_getPlugins, {
			variables: {
				input: {
					isInstalled: false,
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data.getPlugins).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ id: notInstalledPlugin.id }),
			]),
		);
		expect(result.data.getPlugins).toEqual(
			expect.not.arrayContaining([
				expect.objectContaining({ id: installedPlugin.id }),
			]),
		);
	});
});
