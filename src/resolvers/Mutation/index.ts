import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { acceptAdmin } from "./acceptAdmin";
import { acceptMembershipRequest } from "./acceptMembershipRequest";
import { addEventAttendee } from "./addEventAttendee";
import { addFeedback } from "./addFeedback";
import { addLanguageTranslation } from "./addLanguageTranslation";
import { addOrganizationCustomField } from "./addOrganizationCustomField";
import { addOrganizationImage } from "./addOrganizationImage";
import { addUserCustomData } from "./addUserCustomData";
import { addUserImage } from "./addUserImage";
import { addUserToGroupChat } from "./addUserToGroupChat";
import { adminRemoveEvent } from "./adminRemoveEvent";
import { adminRemoveGroup } from "./adminRemoveGroup";
import { assignUserTag } from "./assignUserTag";
import { blockPluginCreationBySuperadmin } from "./blockPluginCreationBySuperadmin";
import { blockUser } from "./blockUser";
import { cancelMembershipRequest } from "./cancelMembershipRequest";
import { updateUserRoleInOrganization } from "./updateUserRoleInOrganization";
import { checkIn } from "./checkIn";
import { createMember } from "./createMember";
import { createActionItem } from "./createActionItem";
import { createAdmin } from "./createAdmin";
import { createComment } from "./createComment";
import { createDirectChat } from "./createDirectChat";
import { createDonation } from "./createDonation";
import { createEvent } from "./createEvent";
import { createGroupChat } from "./createGroupChat";
import { createMessageChat } from "./createMessageChat";
import { createOrganization } from "./createOrganization";
import { createPlugin } from "./createPlugin";
import { createAdvertisement } from "./createAdvertisement";
import { createPost } from "./createPost";
import { createSampleOrganization } from "./createSampleOrganization";
import { createActionItemCategory } from "./createActionItemCategory";
import { createUserTag } from "./createUserTag";
import { deleteDonationById } from "./deleteDonationById";
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
import { removeActionItem } from "./removeActionItem";
import { removeComment } from "./removeComment";
import { removeDirectChat } from "./removeDirectChat";
import { removeEvent } from "./removeEvent";
import { removeEventAttendee } from "./removeEventAttendee";
import { removeGroupChat } from "./removeGroupChat";
import { removeAdvertisement } from "./removeAdvertisement";
import { removeMember } from "./removeMember";
import { removeOrganization } from "./removeOrganization";
import { removeOrganizationCustomField } from "./removeOrganizationCustomField";
import { removeOrganizationImage } from "./removeOrganizationImage";
import { removePost } from "./removePost";
import { removeSampleOrganization } from "./removeSampleOrganization";
import { removeUserCustomData } from "./removeUserCustomData";
import { removeUserFromGroupChat } from "./removeUserFromGroupChat";
import { removeUserImage } from "./removeUserImage";
import { removeUserTag } from "./removeUserTag";
import { revokeRefreshTokenForUser } from "./revokeRefreshTokenForUser";
import { saveFcmToken } from "./saveFcmToken";
import { sendMembershipRequest } from "./sendMembershipRequest";
import { sendMessageToDirectChat } from "./sendMessageToDirectChat";
import { sendMessageToGroupChat } from "./sendMessageToGroupChat";
import { signUp } from "./signUp";
import { togglePostPin } from "./togglePostPin";
import { unassignUserTag } from "./unassignUserTag";
import { unblockUser } from "./unblockUser";
import { unlikeComment } from "./unlikeComment";
import { unlikePost } from "./unlikePost";
import { unregisterForEventByUser } from "./unregisterForEventByUser";
import { updateActionItem } from "./updateActionItem";
import { updateActionItemCategory } from "./updateActionItemCategory";
import { updateEvent } from "./updateEvent";
import { updateLanguage } from "./updateLanguage";
import { updateOrganization } from "./updateOrganization";
import { updatePluginStatus } from "./updatePluginStatus";
import { updatePost } from "./updatePost";
import { updateUserProfile } from "./updateUserProfile";
import { updateUserPassword } from "./updateUserPassword";
import { updateUserTag } from "./updateUserTag";
import { updateUserType } from "./updateUserType";
import { deleteAdvertisementById } from "./deleteAdvertisementById";
import { updateAdvertisement } from "./updateAdvertisement";

export const Mutation: MutationResolvers = {
  acceptAdmin,
  acceptMembershipRequest,
  addEventAttendee,
  addFeedback,
  addLanguageTranslation,
  addOrganizationCustomField,
  addOrganizationImage,
  addUserCustomData,
  addUserImage,
  addUserToGroupChat,
  adminRemoveEvent,
  adminRemoveGroup,
  assignUserTag,
  blockPluginCreationBySuperadmin,
  blockUser,
  cancelMembershipRequest,
  updateUserRoleInOrganization,
  checkIn,
  createMember,
  createAdmin,
  createActionItem,
  createComment,
  createAdvertisement,
  createDirectChat,
  createDonation,
  createEvent,
  createGroupChat,
  createMessageChat,
  createOrganization,
  createPlugin,
  createPost,
  createSampleOrganization,
  createActionItemCategory,
  createUserTag,
  deleteDonationById,
  deleteAdvertisementById,
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
  removeActionItem,
  removeComment,
  removeDirectChat,
  removeEvent,
  removeEventAttendee,
  removeAdvertisement,
  removeGroupChat,
  removeMember,
  removeOrganization,
  removeOrganizationCustomField,
  removeOrganizationImage,
  removeSampleOrganization,
  removePost,
  removeUserCustomData,
  removeUserFromGroupChat,
  removeUserImage,
  removeUserTag,
  revokeRefreshTokenForUser,
  saveFcmToken,
  sendMembershipRequest,
  sendMessageToDirectChat,
  sendMessageToGroupChat,
  signUp,
  togglePostPin,
  unassignUserTag,
  unblockUser,
  unlikeComment,
  unlikePost,
  unregisterForEventByUser,
  updateActionItem,
  updateActionItemCategory,
  updateEvent,
  updateLanguage,
  updateOrganization,
  updatePluginStatus,
  updateUserProfile,
  updateUserPassword,
  updateUserType,
  updateUserTag,
  updatePost,
  updateAdvertisement,
};
