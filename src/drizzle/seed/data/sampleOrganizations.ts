import type { InferInsertModel } from "drizzle-orm";
import type { organizationsTable } from "../../schema";

type OrganizationType = InferInsertModel<typeof organizationsTable>;

export const sampleOrganizations: OrganizationType[] = [
	{
		id: "550e8400-e29b-41d4-a716-446655440013",
		name: "Tech Innovators Alliance",
		description: "Advancing technology for social good",
		isPrivate: false,
		isVisible: true,
		addressLine1: "123 Innovation Way",
		addressLine2: "Suite 400",
		city: "San Francisco",
		state: "CA",
		countryCode: "us",
		postalCode: "94105",
		avatarURI: "https://example.com/avatars/tech-innovators.png",
		createdAt: new Date("2023-01-15T08:00:00Z"),
		updatedAt: new Date("2024-03-10T15:30:00Z"),
		creatorId: "550e8400-e29b-41d4-a716-446655440007",
		updaterId: "550e8400-e29b-41d4-a716-446655440008",
	},
	{
		id: "550e8400-e29b-41d4-a716-446655440014",
		name: "Global Education Initiative",
		description: "Empowering through knowledge",
		isPrivate: false,
		isVisible: true,
		addressLine1: "45 Learning Street",
		addressLine2: null,
		city: "London",
		state: null,
		countryCode: "gb",
		postalCode: "EC1A 1BB",
		avatarURI: "https://example.com/avatars/education-init.png",
		createdAt: new Date("2023-03-20T10:00:00Z"),
		updatedAt: new Date("2024-02-28T12:45:00Z"),
		creatorId: "550e8400-e29b-41d4-a716-446655440008",
		updaterId: "550e8400-e29b-41d4-a716-446655440007",
	},
];
