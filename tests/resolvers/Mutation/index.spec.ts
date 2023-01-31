import { Mutation } from "../../../src/resolvers/Mutation/index";
import { MutationResolvers } from "../../../src/types/generatedGraphQLTypes";
import { acceptAdmin } from "../../../src/resolvers/Mutation/acceptAdmin";
import { acceptMembershipRequest } from "../../../src/resolvers/Mutation/acceptMembershipRequest";
import { addLanguageTranslation } from "../../../src/resolvers/Mutation/addLanguageTranslation";
import { addOrganizationImage } from "../../../src/resolvers/Mutation/addOrganizationImage";
import { addUserImage } from "../../../src/resolvers/Mutation/addUserImage";
import { addUserToGroupChat } from "../../../src/resolvers/Mutation/addUserToGroupChat";
import { adminRemoveEvent } from "../../../src/resolvers/Mutation/adminRemoveEvent";
import { adminRemoveGroup } from "../../../src/resolvers/Mutation/adminRemoveGroup";
import { adminRemovePost } from "../../../src/resolvers/Mutation/adminRemovePost";
import { blockPluginCreationBySuperadmin } from "../../../src/resolvers/Mutation/blockPluginCreationBySuperadmin";
import { blockUser } from "../../../src/resolvers/Mutation/blockUser";
import { cancelMembershipRequest } from "../../../src/resolvers/Mutation/cancelMembershipRequest";
import { createAdmin } from "../../../src/resolvers/Mutation/createAdmin";
import { createComment } from "../../../src/resolvers/Mutation/createComment";
import { createDirectChat } from "../../../src/resolvers/Mutation/createDirectChat";
import { createDonation } from "../../../src/resolvers/Mutation/createDonation";
import { createEvent } from "../../../src/resolvers/Mutation/createEvent";
import { createGroupChat } from "../../../src/resolvers/Mutation/createGroupChat";
import { createMessageChat } from "../../../src/resolvers/Mutation/createMessageChat";
import { createOrganization } from "../../../src/resolvers/Mutation/createOrganization";
import { createPlugin } from "../../../src/resolvers/Mutation/createPlugin";
import { createPost } from "../../../src/resolvers/Mutation/createPost";
import { createTask } from "../../../src/resolvers/Mutation/createTask";
import { deleteDonationById } from "../../../src/resolvers/Mutation/deleteDonationById";
import { forgotPassword } from "../../../src/resolvers/Mutation/forgotPassword";
import { joinPublicOrganization } from "../../../src/resolvers/Mutation/joinPublicOrganization";
import { leaveOrganization } from "../../../src/resolvers/Mutation/leaveOrganization";
import { likeComment } from "../../../src/resolvers/Mutation/likeComment";
import { likePost } from "../../../src/resolvers/Mutation/likePost";
import { login } from "../../../src/resolvers/Mutation/login";
import { logout } from "../../../src/resolvers/Mutation/logout";
import { otp } from "../../../src/resolvers/Mutation/otp";
import { recaptcha } from "../../../src/resolvers/Mutation/recaptcha";
import { refreshToken } from "../../../src/resolvers/Mutation/refreshToken";
import { registerForEvent } from "../../../src/resolvers/Mutation/registerForEvent";
import { rejectAdmin } from "../../../src/resolvers/Mutation/rejectAdmin";
import { rejectMembershipRequest } from "../../../src/resolvers/Mutation/rejectMembershipRequest";
import { removeAdmin } from "../../../src/resolvers/Mutation/removeAdmin";
import { removeComment } from "../../../src/resolvers/Mutation/removeComment";
import { removeDirectChat } from "../../../src/resolvers/Mutation/removeDirectChat";
import { removeEvent } from "../../../src/resolvers/Mutation/removeEvent";
import { removeGroupChat } from "../../../src/resolvers/Mutation/removeGroupChat";
import { removeMember } from "../../../src/resolvers/Mutation/removeMember";
import { removeOrganization } from "../../../src/resolvers/Mutation/removeOrganization";
import { removeOrganizationImage } from "../../../src/resolvers/Mutation/removeOrganizationImage";
import { removePost } from "../../../src/resolvers/Mutation/removePost";
import { removeTask } from "../../../src/resolvers/Mutation/removeTask";
import { removeUserFromGroupChat } from "../../../src/resolvers/Mutation/removeUserFromGroupChat";
import { removeUserImage } from "../../../src/resolvers/Mutation/removeUserImage";
import { revokeRefreshTokenForUser } from "../../../src/resolvers/Mutation/revokeRefreshTokenForUser";
import { saveFcmToken } from "../../../src/resolvers/Mutation/saveFcmToken";
import { sendMembershipRequest } from "../../../src/resolvers/Mutation/sendMembershipRequest";
import { sendMessageToDirectChat } from "../../../src/resolvers/Mutation/sendMessageToDirectChat";
import { sendMessageToGroupChat } from "../../../src/resolvers/Mutation/sendMessageToGroupChat";
import { signUp } from "../../../src/resolvers/Mutation/signUp";
import { unblockUser } from "../../../src/resolvers/Mutation/unblockUser";
import { unlikeComment } from "../../../src/resolvers/Mutation/unlikeComment";
import { unlikePost } from "../../../src/resolvers/Mutation/unlikePost";
import { unregisterForEventByUser } from "../../../src/resolvers/Mutation/unregisterForEventByUser";
import { updateEvent } from "../../../src/resolvers/Mutation/updateEvent";
import { updateLanguage } from "../../../src/resolvers/Mutation/updateLanguage";
import { updateOrganization } from "../../../src/resolvers/Mutation/updateOrganization";
import { updatePluginInstalledOrgs } from "../../../src/resolvers/Mutation/updatePluginInstalledOrgs";
import { updatePluginStatus } from "../../../src/resolvers/Mutation/updatePluginStatus";
import { updateTask } from "../../../src/resolvers/Mutation/updateTask";
import { updateUserProfile } from "../../../src/resolvers/Mutation/updateUserProfile";
import { updateUserType } from "../../../src/resolvers/Mutation/updateUserType";
import { describe, it, beforeAll, expect } from "vitest";

let testResolver: MutationResolvers;

beforeAll(() => {
  testResolver = {
    acceptAdmin,
    acceptMembershipRequest,
    addLanguageTranslation,
    addOrganizationImage,
    addUserImage,
    addUserToGroupChat,
    adminRemoveEvent,
    adminRemoveGroup,
    adminRemovePost,
    blockPluginCreationBySuperadmin,
    blockUser,
    cancelMembershipRequest,
    createAdmin,
    createComment,
    createDirectChat,
    createDonation,
    createEvent,
    createGroupChat,
    createMessageChat,
    createOrganization,
    createPlugin,
    createPost,
    createTask,
    deleteDonationById,
    forgotPassword,
    joinPublicOrganization,
    leaveOrganization,
    likeComment,
    likePost,
    login,
    logout,
    otp,
    recaptcha,
    refreshToken,
    registerForEvent,
    rejectAdmin,
    rejectMembershipRequest,
    removeAdmin,
    removeComment,
    removeDirectChat,
    removeEvent,
    removeGroupChat,
    removeMember,
    removeOrganization,
    removeOrganizationImage,
    removePost,
    removeTask,
    removeUserFromGroupChat,
    removeUserImage,
    revokeRefreshTokenForUser,
    saveFcmToken,
    sendMembershipRequest,
    sendMessageToDirectChat,
    sendMessageToGroupChat,
    signUp,
    unblockUser,
    unlikeComment,
    unlikePost,
    unregisterForEventByUser,
    updateEvent,
    updateLanguage,
    updateOrganization,
    updatePluginInstalledOrgs,
    updatePluginStatus,
    updateTask,
    updateUserProfile,
    updateUserType,
  };
});

describe("resolvers -> Mutation -> index", () => {
  it("creates resolvers", () => {
    expect(testResolver).toStrictEqual(Mutation);
  });
});
