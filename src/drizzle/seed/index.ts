import {
	eventAttachmentsTable,
	eventsTable,
	organizationsTable,
	usersTable,
} from "../schema";
import { sampleEventAttachments } from "./data/sampleEventAttachments";
import { sampleEvents } from "./data/sampleEvents";
import { sampleOrganizations } from "./data/sampleOrganizations";
import { sampleUsers } from "./data/sampleUsers";

import { db } from "./db";
async function main() {
	console.log("🌱 Starting seeding...");
	try {
		// clear up the existing data

		await db.delete(usersTable);
		await db.delete(eventAttachmentsTable);
		await db.delete(eventsTable);

		console.log("✅ Cleaned up existing data");

		// insert new datas

		await db.insert(usersTable).values(sampleUsers);
		console.log("✅ Inserted users");

		await db.insert(organizationsTable).values(sampleOrganizations);
		console.log("✅ Sample org");

		await db.insert(eventsTable).values(sampleEvents);
		console.log("✅ Inserted events");

		await db.insert(eventAttachmentsTable).values(sampleEventAttachments);
		console.log("✅ Inserted event attachments");

		// show completion message

		console.log("✅ Seeding process completed.");
	} catch (error) {
		// error message

		console.error("❌ Seeding failed:", error);
	} finally {
		console.log("🔌 Database connection closed.");

		// exit the process
		process.exit(0);
	}
}

main();
