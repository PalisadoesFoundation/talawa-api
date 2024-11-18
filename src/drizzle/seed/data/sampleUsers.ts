import type { InferInsertModel } from "drizzle-orm";
import type { usersTable } from "../../schema";

type UserInsertType = InferInsertModel<typeof usersTable>;

export const sampleUsers: UserInsertType[] = [
	{
		id: "550e8400-e29b-41d4-a716-446655440007", // UUID for Admin
		email: "admin@example.com",
		addressLine1: "123 Main St",
		addressLine2: "Apt 4B",
		avatarURI: "/images/avatar1.png",
		birthDate: new Date("1990-01-01"),
		city: "New York",
		countryCode: "us",
		createdAt: new Date(),
		creatorId: null,
		description: "A sample user description",
		state: "NY",
		firstName: "Admin",
		lastName: "User",
		isAdminstrator: true,
		isEmailVerified: true,
		mobilePhoneNumber: "9876543210",
		name: "admin_user",
		passwordHash: "hashed_password_123",
		postalCode: "12345",
		updatedAt: new Date(),
	},
	{
		id: "550e8400-e29b-41d4-a716-446655440008", // UUID for Admin1
		email: "admin2@example.com",
		addressLine1: "124 Main St",
		addressLine2: "Att 4B",
		avatarURI: "/images2/avatar2.png",
		birthDate: new Date("1990-01-01"),
		city: "New York",
		countryCode: "us",
		createdAt: new Date(),
		creatorId: null,
		description: "A sample2 user description",
		state: "NY",
		firstName: "Admin1",
		lastName: "User",
		isAdminstrator: true,
		isEmailVerified: true,
		mobilePhoneNumber: "9876243210",
		name: "admin_user1",
		passwordHash: "hashed_password_1232",
		postalCode: "12342",
		updatedAt: new Date(),
	},
];
