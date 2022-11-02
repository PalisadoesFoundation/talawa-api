import { MutationResolvers } from "../../../generated/graphqlCodegen";
import { acceptAdmin } from "./acceptAdmin";
import { acceptMembershipRequest } from "./acceptMembershipRequest";
import { addLanguageTranslation } from "./addLanguageTranslation";
import { addOrganizationImage } from "./addOrganizationImage";
import { addUserImage } from "./addUserImage";
import { addUserToGroupChat } from "./addUserToGroupChat";
import { adminRemoveEvent } from "./adminRemoveEvent";
import { adminRemoveGroup } from "./adminRemoveGroup";
import { adminRemovePost } from "./adminRemovePost";
import { blockPluginCreationBySuperadmin } from "./blockPluginCreationBySuperadmin";
import { blockUser } from "./blockUser";
import { cancelMembershipRequest } from "./cancelMembershipRequest";
import { createAdmin } from "./createAdmin";
import { createComment } from "./createComment";
import { createDirectChat } from "./createDirectChat";
import { createEvent } from "./createEvent";
import { createGroupChat } from "./createGroupChat";
import { createMessageChat } from "./createMessageChat";
import { createOrganization } from "./createOrganization";
import { createPlugin } from "./createPlugin";
import { createPost } from "./createPost";
import { createTask } from "./createTask";
import { forgotPassword } from "./forgotPassword";
import { joinPublicOrganization } from "./joinPublicOrganization";
import { leaveOrganization } from "./leaveOrganization";
import { likeComment } from "./likeComment";
import { likePost } from "./likePost";
import { login } from "./login";
import { logout } from "./logout";
import { otp } from "./otp";
import { recaptcha } from "./recaptcha";
import { refreshToken } from "./refreshToken";
import { registerForEvent } from "./registerForEvent";
import { rejectAdmin } from "./rejectAdmin";
import { rejectMembershipRequest } from "./rejectMembershipRequest";
import { removeAdmin } from "./removeAdmin";
import { removeComment } from "./removeComment";
import { removeDirectChat } from "./removeDirectChat";
import { removeEvent } from "./removeEvent";
import { removeGroupChat } from "./removeGroupChat";
import { removeMember } from "./removeMember";
import { removeOrganization } from "./removeOrganization";
import { removeOrganizationImage } from "./removeOrganizationImage";
import { removePost } from "./removePost";
import { removeTask } from "./removeTask";
import { removeUserFromGroupChat } from "./removeUserFromGroupChat";
import { removeUserImage } from "./removeUserImage";
import { revokeRefreshTokenForUser } from "./revokeRefreshTokenForUser";
import { saveFcmToken } from "./saveFcmToken";
import { sendMembershipRequest } from "./sendMembershipRequest";
import { sendMessageToDirectChat } from "./sendMessageToDirectChat";
import { sendMessageToGroupChat } from "./sendMessageToGroupChat";
import { signUp } from "./signUp";
import { unblockUser } from "./unblockUser";
import { unlikeComment } from "./unlikeComment";
import { unlikePost } from "./unlikePost";
import { unregisterForEventByUser } from "./unregisterForEventByUser";
import { updateEvent } from "./updateEvent";
import { updateLanguage } from "./updateLanguage";
import { updateOrganization } from "./updateOrganization";
import { updatePluginInstalledOrgs } from "./updatePluginInstalledOrgs";
import { updatePluginStatus } from "./updatePluginStatus";
import { updateTask } from "./updateTask";
import { updateUserProfile } from "./updateUserProfile";
import { updateUserType } from "./updateUserType";

export const Mutation: MutationResolvers = {
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
  createEvent,
  createGroupChat,
  createMessageChat,
  createOrganization,
  createPlugin,
  createPost,
  createTask,
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
