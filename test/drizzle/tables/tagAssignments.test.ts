import { describe, it, expect, afterAll } from 'vitest';
import { getTableName, getTableColumns, eq, and } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { faker } from '@faker-js/faker';
import { tagAssignmentsTable, tagAssignmentsTableRelations, tagAssignmentsTableInsertSchema } from '../../../src/drizzle/tables/tagAssignments';
import { usersTable } from '../../../src/drizzle/tables/users';
import { tagsTable } from '../../../src/drizzle/tables/tags';
import { organizationsTable } from '../../../src/drizzle/tables/organizations';

// Setup DB connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL_TEST });
const db = drizzle(pool);

describe('src/drizzle/tables/tagAssignments.ts', () => {
  
  afterAll(async () => {
    await pool.end();
  });

  describe('Table Schema (Static Checks)', () => {
    it('should have the correct table name', () => {
      expect(getTableName(tagAssignmentsTable)).toBe('tag_assignments');
    });

    it('should have all 4 required columns', () => {
      const columns = getTableColumns(tagAssignmentsTable);
      const columnNames = Object.keys(columns);
      expect(columnNames).toHaveLength(4);
      expect(columnNames).toContain('assigneeId');
      expect(columnNames).toContain('tagId');
      expect(columnNames).toContain('creatorId');
      expect(columnNames).toContain('createdAt');
    });

    it('should enforce notNull constraints on columns', () => {
      const columns = getTableColumns(tagAssignmentsTable);
      expect(columns.assigneeId.notNull).toBe(true);
      expect(columns.tagId.notNull).toBe(true);
    });
  });

  describe('Table Relations', () => {
    it('should be defined', () => {
      expect(tagAssignmentsTableRelations).toBeDefined();
    });
  });

  describe('Insert Schema Validation (Zod)', () => {
    it('should validate proper UUIDs', () => {
      const validData = {
        assigneeId: faker.string.uuid(),
        tagId: faker.string.uuid(),
        creatorId: faker.string.uuid(),
      };
      expect(() => tagAssignmentsTableInsertSchema.parse(validData)).not.toThrow();
    });

    it('should reject invalid data', () => {
      const invalidData = {
        assigneeId: "not-a-uuid",
        tagId: "not-a-uuid",
        creatorId: faker.string.uuid(),
      };
      expect(() => tagAssignmentsTableInsertSchema.parse(invalidData)).toThrow();
    });
  });

  describe('Database Operations (Integration)', () => {
    
    // FIX (New): Foreign Key Constraint Check
    it('should enforce foreign key constraints (reject non-existent IDs)', async () => {
      const fakeId = faker.string.uuid();
      const invalidAssignment = {
        assigneeId: fakeId, // Does not exist
        tagId: fakeId,      // Does not exist
        creatorId: fakeId   // Does not exist
      };

      // The DB should throw an error because these parents don't exist
      await expect(
        db.insert(tagAssignmentsTable).values(invalidAssignment).returning()
      ).rejects.toThrow();
    });

    it('should successfully insert, retrieve, and clean up a record', async () => {
      // 0. Create Organization
      const [organization] = await db.insert(organizationsTable).values({
        name: faker.company.name(),
        slug: `${faker.lorem.slug()}-${faker.string.uuid()}`, 
        isPublic: true
      // biome-ignore lint/suspicious/noExplicitAny: simplifying test setup
      } as any).returning();
      if (!organization) throw new Error("Failed to create organization");

      // 1. Create Assignee
      const [assignee] = await db.insert(usersTable).values({
        name: 'Test User',
        emailAddress: faker.internet.email(),
        isEmailAddressVerified: true,
        failedLoginAttempts: 0,
        passwordHash: 'hashed_password_placeholder',
        role: 'USER', 
        isBlocked: false,
        isVerified: true
      // biome-ignore lint/suspicious/noExplicitAny: simplifying test setup
      } as any).returning();
      if (!assignee) throw new Error("Failed to create assignee");

      // 2. Create Creator
      const [creator] = await db.insert(usersTable).values({
        name: 'Creator User',
        emailAddress: faker.internet.email(),
        isEmailAddressVerified: true,
        failedLoginAttempts: 0,
        passwordHash: 'hashed_password_placeholder',
        role: 'USER',
        isBlocked: false,
        isVerified: true
      // biome-ignore lint/suspicious/noExplicitAny: simplifying test setup
      } as any).returning();
      if (!creator) throw new Error("Failed to create creator");

      // 3. Create Tag
      const [tag] = await db.insert(tagsTable).values({
        name: `${faker.lorem.word()}_${faker.string.uuid()}`,
        creatorId: creator.id,
        organizationId: organization.id 
      // biome-ignore lint/suspicious/noExplicitAny: simplifying test setup
      } as any).returning();
      if (!tag) throw new Error("Failed to create tag");

      // 4. Insert Assignment
      const newAssignment = {
        assigneeId: assignee.id,
        tagId: tag.id,
        creatorId: creator.id
      };

      const insertResult = await db.insert(tagAssignmentsTable)
        .values(newAssignment)
        .returning();
      
      const result = insertResult[0];
      if (!result) throw new Error("Insert failed: No data returned");

      // Verify Data
      expect(result.assigneeId).toBe(assignee.id);
      
      // Verify Defaults (createdAt)
      expect(result.createdAt).toBeDefined();
      expect(result.createdAt).toBeInstanceOf(Date);

      // 5. Verify Uniqueness (Composite Primary Key Check)
      await expect(
        db.insert(tagAssignmentsTable).values(newAssignment).returning()
      ).rejects.toThrow();

      // 6. Cleanup
      await db.delete(tagAssignmentsTable)
        .where(and(
          eq(tagAssignmentsTable.assigneeId, assignee.id),
          eq(tagAssignmentsTable.tagId, tag.id)
        ));

      // Delete Parents
      await db.delete(tagsTable).where(eq(tagsTable.id, tag.id));
      await db.delete(usersTable).where(eq(usersTable.id, assignee.id));
      await db.delete(usersTable).where(eq(usersTable.id, creator.id));
      await db.delete(organizationsTable).where(eq(organizationsTable.id, organization.id));
    });
  });
});