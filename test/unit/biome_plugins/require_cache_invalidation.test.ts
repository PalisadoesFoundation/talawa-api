import { exec } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const execAsync = promisify(exec);

/**
 * Tests for the require_cache_invalidation.grit GritQL rule.
 *
 * This rule warns when GraphQL mutations lack cache invalidation calls
 * (invalidateEntity/invalidateEntityLists) in their resolver body.
 */
describe("require_cache_invalidation GritQL rule", () => {
	const fixtureDir = join(__dirname, "__fixtures__");
	const diagnosticMessage = "Mutation may need cache invalidation";

	/**
	 * Helper to run biome lint on a file and capture output.
	 * Returns { stdout, stderr, exitCode }
	 */
	async function runBiomeLint(filePath: string): Promise<{
		stdout: string;
		stderr: string;
		output: string;
		exitCode: number;
	}> {
		try {
			const { stdout, stderr } = await execAsync(
				`pnpm biome lint "${filePath}" --max-diagnostics=100`,
				{ cwd: join(__dirname, "../../..") },
			);
			return { stdout, stderr, output: stdout + stderr, exitCode: 0 };
		} catch (error) {
			// exec throws on non-zero exit code - capture the output anyway
			const execError = error as {
				stdout?: string;
				stderr?: string;
				code?: number;
			};
			const stdout = execError.stdout ?? "";
			const stderr = execError.stderr ?? "";
			return {
				stdout,
				stderr,
				output: stdout + stderr,
				exitCode: execError.code ?? 1,
			};
		}
	}

	beforeAll(async () => {
		await mkdir(fixtureDir, { recursive: true });
	});

	afterAll(async () => {
		await rm(fixtureDir, { recursive: true, force: true });
	});

	// ============================================================
	// POSITIVE CASES - Should NOT trigger warning
	// ============================================================
	describe("positive cases (should NOT trigger warning)", () => {
		it("should not warn when invalidateEntity is called", async () => {
			const filePath = join(fixtureDir, "positive_invalidateEntity.ts");
			await writeFile(
				filePath,
				`
import { invalidateEntity } from "~/src/services/caching";
import { builder } from "~/src/graphql/builder";

builder.mutationField("updateFoo", (t) =>
  t.field({
    resolve: async (_, args, ctx) => {
      const result = await ctx.drizzleClient.update(table).set({}).returning();
      await invalidateEntity(ctx.cache, "foo", args.id);
      return result;
    }
  })
);
`,
			);

			const { stdout } = await runBiomeLint(filePath);
			expect(stdout).not.toContain(diagnosticMessage);
		});

		it("should not warn when invalidateEntityLists is called", async () => {
			const filePath = join(fixtureDir, "positive_invalidateEntityLists.ts");
			await writeFile(
				filePath,
				`
import { invalidateEntityLists } from "~/src/services/caching";
import { builder } from "~/src/graphql/builder";

builder.mutationField("createBar", (t) =>
  t.field({
    resolve: async (_, args, ctx) => {
      const result = await ctx.drizzleClient.insert(table).values({}).returning();
      await invalidateEntityLists(ctx.cache, "bar");
      return result;
    }
  })
);
`,
			);

			const { stdout } = await runBiomeLint(filePath);
			expect(stdout).not.toContain(diagnosticMessage);
		});

		it("should not warn when both invalidation functions are called", async () => {
			const filePath = join(fixtureDir, "positive_both.ts");
			await writeFile(
				filePath,
				`
import { invalidateEntity, invalidateEntityLists } from "~/src/services/caching";
import { builder } from "~/src/graphql/builder";

builder.mutationField("updateBaz", (t) =>
  t.field({
    resolve: async (_, args, ctx) => {
      const result = await ctx.drizzleClient.update(table).set({}).returning();
      await Promise.all([
        invalidateEntity(ctx.cache, "baz", args.id),
        invalidateEntityLists(ctx.cache, "baz"),
      ]);
      return result;
    }
  })
);
`,
			);

			const { stdout } = await runBiomeLint(filePath);
			expect(stdout).not.toContain(diagnosticMessage);
		});

		it("should not warn when invalidation is inside try/catch for graceful degradation", async () => {
			const filePath = join(fixtureDir, "positive_tryCatch.ts");
			await writeFile(
				filePath,
				`
import { invalidateEntity, invalidateEntityLists } from "~/src/services/caching";
import { builder } from "~/src/graphql/builder";

builder.mutationField("updateWithGracefulDegradation", (t) =>
  t.field({
    resolve: async (_, args, ctx) => {
      const result = await ctx.drizzleClient.transaction(async (tx) => {
        return await tx.update(table).set({}).returning();
      });

      try {
        await Promise.all([
          invalidateEntity(ctx.cache, "entity", args.id),
          invalidateEntityLists(ctx.cache, "entity"),
        ]);
      } catch (error) {
        ctx.log.warn({ error }, "Cache invalidation failed (non-fatal)");
      }

      return result;
    }
  })
);
`,
			);

			const { stdout } = await runBiomeLint(filePath);
			expect(stdout).not.toContain(diagnosticMessage);
		});

		it("should not warn when invalidation is in .then() after transaction commit", async () => {
			const filePath = join(fixtureDir, "positive_thenChain.ts");
			await writeFile(
				filePath,
				`
import { invalidateEntity, invalidateEntityLists } from "~/src/services/caching";
import { builder } from "~/src/graphql/builder";

builder.mutationField("updateAfterCommit", (t) =>
  t.field({
    resolve: async (_, args, ctx) => {
      return await ctx.drizzleClient
        .transaction(async (tx) => {
          return await tx.update(table).set({}).returning();
        })
        .then(async (result) => {
          try {
            await invalidateEntity(ctx.cache, "entity", args.id);
            await invalidateEntityLists(ctx.cache, "entity");
          } catch (error) {
            ctx.log.warn({ error }, "Failed to invalidate cache");
          }
          return result;
        });
    }
  })
);
`,
			);

			const { stdout } = await runBiomeLint(filePath);
			expect(stdout).not.toContain(diagnosticMessage);
		});

		it("should not warn when invalidation uses multiple arguments (real-world pattern)", async () => {
			const filePath = join(fixtureDir, "positive_multipleArgs.ts");
			await writeFile(
				filePath,
				`
import { invalidateEntity, invalidateEntityLists } from "~/src/services/caching";
import { builder } from "~/src/graphql/builder";

// This test ensures the GritQL pattern matches calls with multiple arguments
// like the real caching functions: invalidateEntity(ctx.cache, "organization", id)
builder.mutationField("updateWithMultipleArgs", (t) =>
  t.field({
    resolve: async (_, args, ctx) => {
      const result = await ctx.drizzleClient.transaction(async (tx) => {
        return await tx.update(organizationsTable).set({}).returning();
      });

      try {
        await Promise.all([
          invalidateEntity(ctx.cache, "organization", args.input.id),
          invalidateEntityLists(ctx.cache, "organization"),
        ]);
      } catch (error) {
        ctx.log.warn({ error }, "Cache invalidation failed");
      }

      return result;
    }
  })
);
`,
			);

			const { output } = await runBiomeLint(filePath);
			// Should not warn - invalidation functions are called with multiple args
			expect(output).not.toContain(diagnosticMessage);
		});
	});

	// ============================================================
	// NEGATIVE CASES - Should trigger warning
	// ============================================================
	describe("negative cases (should trigger warning)", () => {
		it("should warn when mutation has no cache invalidation", async () => {
			const filePath = join(fixtureDir, "negative_noInvalidation.ts");
			await writeFile(
				filePath,
				`
import { builder } from "~/src/graphql/builder";

builder.mutationField("updateWithoutCache", (t) =>
  t.field({
    resolve: async (_, args, ctx) => {
      const result = await ctx.drizzleClient.update(table).set({}).returning();
      return result;
    }
  })
);
`,
			);

			const { output } = await runBiomeLint(filePath);
			expect(output).toContain(diagnosticMessage);
			expect(output).toContain("updateWithoutCache");
		});

		it("should warn when invalidation is commented out", async () => {
			const filePath = join(fixtureDir, "negative_commentedOut.ts");
			await writeFile(
				filePath,
				`
import { invalidateEntity } from "~/src/services/caching";
import { builder } from "~/src/graphql/builder";

builder.mutationField("updateCommentedCache", (t) =>
  t.field({
    resolve: async (_, args, ctx) => {
      const result = await ctx.drizzleClient.update(table).set({}).returning();
      // await invalidateEntity(ctx.cache, "entity", args.id);
      return result;
    }
  })
);
`,
			);

			const { output } = await runBiomeLint(filePath);
			expect(output).toContain(diagnosticMessage);
			expect(output).toContain("updateCommentedCache");
		});

		it("should warn when function is imported but not called", async () => {
			const filePath = join(fixtureDir, "negative_importedNotCalled.ts");
			await writeFile(
				filePath,
				`
import { invalidateEntity, invalidateEntityLists } from "~/src/services/caching";
import { builder } from "~/src/graphql/builder";

// Functions are imported but never called in the resolver
builder.mutationField("updateImportedNotCalled", (t) =>
  t.field({
    resolve: async (_, args, ctx) => {
      const result = await ctx.drizzleClient.update(table).set({}).returning();
      // Forgot to call the invalidation functions
      return result;
    }
  })
);
`,
			);

			const { output } = await runBiomeLint(filePath);
			expect(output).toContain(diagnosticMessage);
			expect(output).toContain("updateImportedNotCalled");
		});

		it("should warn when invalidation is in a different function scope", async () => {
			const filePath = join(fixtureDir, "negative_differentScope.ts");
			await writeFile(
				filePath,
				`
import { invalidateEntity } from "~/src/services/caching";
import { builder } from "~/src/graphql/builder";

// Helper function with invalidation - but not called from resolver
async function helperWithCache(cache: any, id: string) {
  await invalidateEntity(cache, "entity", id);
}

builder.mutationField("updateDifferentScope", (t) =>
  t.field({
    resolve: async (_, args, ctx) => {
      const result = await ctx.drizzleClient.update(table).set({}).returning();
      // helperWithCache is not called here
      return result;
    }
  })
);
`,
			);

			const { output } = await runBiomeLint(filePath);
			expect(output).toContain(diagnosticMessage);
			expect(output).toContain("updateDifferentScope");
		});
	});

	// ============================================================
	// EDGE CASES
	// ============================================================
	describe("edge cases", () => {
		it("should warn for each mutation without invalidation in multi-mutation file", async () => {
			const filePath = join(fixtureDir, "edge_multipleMutations.ts");
			await writeFile(
				filePath,
				`
import { invalidateEntity } from "~/src/services/caching";
import { builder } from "~/src/graphql/builder";

// This mutation HAS invalidation - should NOT warn
builder.mutationField("withCache", (t) =>
  t.field({
    resolve: async (_, args, ctx) => {
      const result = await ctx.drizzleClient.update(table).set({}).returning();
      await invalidateEntity(ctx.cache, "entity", args.id);
      return result;
    }
  })
);

// This mutation does NOT have invalidation - SHOULD warn
builder.mutationField("withoutCache", (t) =>
  t.field({
    resolve: async (_, args, ctx) => {
      const result = await ctx.drizzleClient.update(table).set({}).returning();
      return result;
    }
  })
);

// Another mutation without invalidation - SHOULD warn
builder.mutationField("alsoWithoutCache", (t) =>
  t.field({
    resolve: async (_, args, ctx) => {
      return await ctx.drizzleClient.insert(table).values({}).returning();
    }
  })
);
`,
			);

			const { output } = await runBiomeLint(filePath);
			// Should warn for 2 mutations, not 3
			expect(output).toContain("withoutCache");
			expect(output).toContain("alsoWithoutCache");
			// Should NOT warn for the one with invalidation (it has cache calls so no warning)
			// The warning message includes the mutation name in quotes, so check for pattern
			expect(output.match(/"withCache"/g)?.length || 0).toBeLessThanOrEqual(1);
		});

		it("should detect invalidation in nested arrow functions", async () => {
			const filePath = join(fixtureDir, "edge_nestedFunctions.ts");
			await writeFile(
				filePath,
				`
import { invalidateEntity } from "~/src/services/caching";
import { builder } from "~/src/graphql/builder";

builder.mutationField("nestedInvalidation", (t) =>
  t.field({
    resolve: async (_, args, ctx) => {
      return await ctx.drizzleClient
        .transaction(async (tx) => {
          return await tx.update(table).set({}).returning();
        })
        .then(async (result) => {
          const doInvalidation = async () => {
            await invalidateEntity(ctx.cache, "entity", args.id);
          };
          await doInvalidation();
          return result;
        });
    }
  })
);
`,
			);

			const { output } = await runBiomeLint(filePath);
			// The rule should detect invalidateEntity even in nested functions
			expect(output).not.toContain(diagnosticMessage);
		});

		it("should handle empty resolver gracefully", async () => {
			const filePath = join(fixtureDir, "edge_emptyResolver.ts");
			await writeFile(
				filePath,
				`
import { builder } from "~/src/graphql/builder";

builder.mutationField("emptyResolver", (t) =>
  t.field({
    resolve: async () => {
      return null;
    }
  })
);
`,
			);

			const { output } = await runBiomeLint(filePath);
			// Empty resolver should still trigger warning (no invalidation)
			expect(output).toContain(diagnosticMessage);
			expect(output).toContain("emptyResolver");
		});
	});
});
