// test/utilities/mockUser.ts
import type { User } from "~/src/graphql/types/User/User";
export type DeepPartial<T> = {
	[P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export const createMockUser = (
	overrides?: DeepPartial<User>,
): DeepPartial<User> => ({
	id: "123",
	name: "John Doe",
	role: "administrator",
	createdAt: new Date(),
	updatedAt: null,
	...overrides, // Allows customization per test case
});
