import { describe, it, expect, afterAll } from "vitest";
import { eq, and } from "drizzle-orm";
import { faker } from "@faker-js/faker";
import { usersTable } from "~/src/drizzle/tables/users";
import { organizationsTable } from "~/src/drizzle/tables/organizations";
import { createRegularUserUsingAdmin } from "test/graphql/types/createRegularUserUsingAdmin";
import { createTestOrganization, loginAdminUser } from "./GlobalFunctions";
import { organizationMembershipsTable } from "~/src/drizzle/tables/organizationMemberships";
import { server } from "test/server";

describe("organizationMembershipsTable database operations", async () => {
  const testOrg = await createTestOrganization();
  const testUser = await createRegularUserUsingAdmin();
  const creatorUser = await loginAdminUser();

  afterAll(async () => {
    await server.drizzleClient
      .delete(organizationMembershipsTable)
      .where(eq(organizationMembershipsTable.organizationId, testOrg));

    await server.drizzleClient
      .delete(organizationsTable)
      .where(eq(organizationsTable.id, testOrg));

    await server.drizzleClient
      .delete(usersTable)
      .where(eq(usersTable.id, testUser.userId));

    await server.drizzleClient
      .delete(usersTable)
      .where(eq(usersTable.id, creatorUser.adminId));
  });

  it("creates membership with required fields", async () => {
    const [membership] = await server.drizzleClient
      .insert(organizationMembershipsTable)
      .values({
        memberId: testUser.userId,
        organizationId: testOrg,
        role: "regular",
      })
      .returning();

    expect(membership).toBeDefined();
    expect(membership?.memberId).toBe(testUser.userId);
    expect(membership?.organizationId).toBe(testOrg);
    expect(membership?.role).toBe("regular");
    expect(membership?.createdAt).toBeInstanceOf(Date);
  });

  it("sets createdAt automatically on insert", async () => {
    const before = new Date();

    const [membership] = await server.drizzleClient
      .insert(organizationMembershipsTable)
      .values({
        memberId: testUser.userId,
        organizationId: testOrg,
        role: "regular",
      })
      .returning();

    const after = new Date();

    expect(membership?.createdAt.getTime()).toBeGreaterThanOrEqual(
      before.getTime()
    );
    expect(membership?.createdAt.getTime()).toBeLessThanOrEqual(
      after.getTime()
    );
  });

  it("allows optional creatorId and updaterId", async () => {
    const [membership] = await server.drizzleClient
      .insert(organizationMembershipsTable)
      .values({
        memberId: testUser.userId,
        organizationId: testOrg,
        role: "administrator",
        creatorId: creatorUser.adminId,
        updaterId: creatorUser.adminId,
      })
      .returning();

    expect(membership?.creatorId).toBe(creatorUser.adminId);
    expect(membership?.updaterId).toBe(creatorUser.adminId);
  });

  it("enforces composite primary key on memberId and organizationId", async () => {
    await server.drizzleClient.insert(organizationMembershipsTable).values({
      memberId: testUser.userId,
      organizationId: testOrg,
      role: "regular",
    });

    await expect(
      server.drizzleClient.insert(organizationMembershipsTable).values({
        memberId: testUser.userId,
        organizationId: testOrg,
        role: "administrator",
      })
    ).rejects.toThrow();
  });

  it("updates updatedAt timestamp on update", async () => {
    const [membership] = await server.drizzleClient
      .insert(organizationMembershipsTable)
      .values({
        memberId: testUser.userId,
        organizationId: testOrg,
        role: "regular",
      })
      .returning();

    await new Promise((resolve) => setTimeout(resolve, 10));

    const [updated] = await server.drizzleClient
      .update(organizationMembershipsTable)
      .set({ role: "administrator" })
      .where(
        and(
          eq(organizationMembershipsTable.memberId, testUser.userId),
          eq(organizationMembershipsTable.organizationId, testOrg)
        )
      )
      .returning();

    expect(updated?.updatedAt).toBeDefined();
    expect(updated?.updatedAt?.getTime()).toBeGreaterThan(
      (membership?.createdAt as Date).getTime()
    );
  });

  it("cascades delete when user is deleted", async () => {
    const user = await createRegularUserUsingAdmin();
    await server.drizzleClient.insert(organizationMembershipsTable).values({
      memberId: user.userId,
      organizationId: testOrg,
      role: "regular",
    });

    await server.drizzleClient
      .delete(usersTable)
      .where(eq(usersTable.id, user.userId));

    const memberships = await server.drizzleClient
      .select()
      .from(organizationMembershipsTable)
      .where(eq(organizationMembershipsTable.memberId, user.userId));

    expect(memberships.length).toBe(0);
  });

  it("cascades delete when organization is deleted", async () => {
    const [org] = await server.drizzleClient
      .insert(organizationsTable)
      .values({
        id: faker.string.uuid(),
        name: "Temp Org",
        countryCode: "us",
      })
      .returning();

    await server.drizzleClient.insert(organizationMembershipsTable).values({
      memberId: testUser.userId,
      organizationId: org?.id as string,
      role: "regular",
    });

    await server.drizzleClient
      .delete(organizationsTable)
      .where(eq(organizationsTable.id, org?.id as string));

    const memberships = await server.drizzleClient
      .select()
      .from(organizationMembershipsTable)
      .where(
        eq(organizationMembershipsTable.organizationId, org?.id as string)
      );

    expect(memberships.length).toBe(0);
  });

  it("sets creatorId to null when creator is deleted", async () => {
    const creator = await createRegularUserUsingAdmin();

    const [membership] = await server.drizzleClient
      .insert(organizationMembershipsTable)
      .values({
        memberId: testUser.userId,
        organizationId: testOrg,
        role: "regular",
        creatorId: creator.userId,
      })
      .returning();

    await server.drizzleClient
      .delete(usersTable)
      .where(eq(usersTable.id, creator.userId));

    const [updated] = await server.drizzleClient
      .select()
      .from(organizationMembershipsTable)
      .where(
        and(
          eq(
            organizationMembershipsTable.memberId,
            membership?.memberId as string
          ),
          eq(
            organizationMembershipsTable.organizationId,
            membership?.organizationId as string
          )
        )
      );

    expect(updated?.creatorId).toBeNull();
  });

  it("accepts all valid role values", async () => {
    const roles = ["regular", "administrator"];

    for (const role of roles) {
      const user = await createRegularUserUsingAdmin();

      const [membership] = await server.drizzleClient
        .insert(organizationMembershipsTable)
        .values({
          memberId: testUser.userId,
          organizationId: testOrg,
          role: role as "regular" | "administrator",
          creatorId: creatorUser.adminId,
        })
        .returning();

      expect(membership?.role).toBe(role);

      await server.drizzleClient
        .delete(usersTable)
        .where(eq(usersTable.id, user.userId));
    }
  });

  it("queries membership by indexes", async () => {
    await server.drizzleClient.insert(organizationMembershipsTable).values({
      memberId: testUser.userId,
      organizationId: testOrg,
      role: "regular",
      creatorId: creatorUser.adminId,
    });

    const byMember = await server.drizzleClient
      .select()
      .from(organizationMembershipsTable)
      .where(eq(organizationMembershipsTable.memberId, testUser.userId));

    expect(byMember.length).toBeGreaterThan(0);

    const byOrg = await server.drizzleClient
      .select()
      .from(organizationMembershipsTable)
      .where(eq(organizationMembershipsTable.organizationId, testOrg));

    expect(byOrg.length).toBeGreaterThan(0);

    const byRole = await server.drizzleClient
      .select()
      .from(organizationMembershipsTable)
      .where(eq(organizationMembershipsTable.role, "regular"));

    expect(byRole.length).toBeGreaterThan(0);
  });
});
