import { User } from "../models";

export const updateUserToSuperAdmin = async (email: string) => {
  await User.findOneAndUpdate(
    { email },
    { userType: "SUPERADMIN", adminApproved: true }
  );
};
