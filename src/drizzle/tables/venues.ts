import { relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  check,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { uuidv7 } from "uuidv7";
import { organizationsTable } from "./organizations";
import { usersTable } from "./users";
import { venueAttachmentsTable } from "./venueAttachments";
import { venueBookingsTable } from "./venueBookings";

/**
 * Drizzle orm postgres table definition for venues.
 */
export const venuesTable = pgTable(
  "venues",
  {
    /**
     * Date time at the time the venue was created.
     */
    createdAt: timestamp("created_at", {
      mode: "date",
      precision: 3,
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    /**
     * Foreign key reference to the id of the user who created the venue.
     */
    creatorId: uuid("creator_id").references(() => usersTable.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    /**
     * Custom information about the venue.
     */
    description: text("description", {}),
    /**
     * Primary unique identifier of the venue.
     */
    id: uuid("id").primaryKey().$default(uuidv7),
    /**
     * Name of the venue.
     */
    name: text("name", {}).notNull(),
    /**
     * Foreign key reference to the id of the organization is venue is associated to.
     */
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizationsTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    /*
			Capacity of the venue
			*/
    capacity: integer("capacity").notNull(),
    /**
     * Date time at the time the venue was last updated.
     */
    updatedAt: timestamp("updated_at", {
      mode: "date",
      precision: 3,
      withTimezone: true,
    })
      .$defaultFn(() => sql`${null}`)
      .$onUpdate(() => new Date()),
    /**
     * Foreign key reference to the id of the user who last updated the venue.
     */
    updaterId: uuid("updater_id").references(() => usersTable.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
  },
  (self) => ({
    capacityCheck: check("capacity_check", sql`${self.capacity} >= 1`),

    indexes: [
      index("created_at_idx").on(self.createdAt),
      index("creator_id_idx").on(self.creatorId),
      index("name_idx").on(self.name),
      index("organization_id_idx").on(self.organizationId),
      uniqueIndex("unique_venue_name_per_org").on(
        self.name,
        self.organizationId
      ),
    ],
  })
);

export const venuesTableRelations = relations(venuesTable, ({ many, one }) => ({
  /**
   * Many to one relationship from `venues` table to `users` table.
   */
  creator: one(usersTable, {
    fields: [venuesTable.creatorId],
    references: [usersTable.id],
    relationName: "users.id:venues.creator_id",
  }),
  /**
   * Many to one relationship from `venues` table to `organizations` table.
   */
  organization: one(organizationsTable, {
    fields: [venuesTable.organizationId],
    references: [organizationsTable.id],
    relationName: "organizations.id:venues.organization_id",
  }),
  /**
   * Many to one relationship from `venues` table to `users` table.
   */
  updater: one(usersTable, {
    fields: [venuesTable.updaterId],
    references: [usersTable.id],
    relationName: "users.id:venues.updater_id",
  }),
  /**
   * One to many relationship from `venues` table to `venue_attachments` table.
   */
  attachmentsWhereVenue: many(venueAttachmentsTable, {
    relationName: "venue_attachments.venue_id:venues.id",
  }),
  /**
   * One to many relationship from `venues` table to `venue_bookings` table.
   */
  venueBookingsWhereVenue: many(venueBookingsTable, {
    relationName: "venue_bookings.venue_id:venues.id",
  }),
}));

export const venuesTableInsertSchema = createInsertSchema(venuesTable, {
  description: (schema) => schema.min(1).max(2048).optional(),
  name: (schema) => schema.min(1).max(256),
});
