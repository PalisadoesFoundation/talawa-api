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
import { addUserToUserFamily } from "./addUserToUserFamily";
import { adminRemoveEvent } from "./adminRemoveEvent";
import { adminRemoveGroup } from "./adminRemoveGroup";
import { assignUserTag } from "./assignUserTag";
import { blockPluginCreationBySuperadmin } from "./blockPluginCreationBySuperadmin";
import { blockUser } from "./blockUser";
import { cancelMembershipRequest } from "./cancelMembershipRequest";
import { checkIn } from "./checkIn";
import { createActionItem } from "./createActionItem";
import { createActionItemCategory } from "./createActionItemCategory";
import { createAdmin } from "./createAdmin";
import { createAdvertisement } from "./createAdvertisement";
import { createAgendaCategory } from "./createAgendaCategory";
import { createComment } from "./createComment";
import { createDirectChat } from "./createDirectChat";
import { createDonation } from "./createDonation";
import { createEvent } from "./createEvent";
import { createEventVolunteer } from "./createEventVolunteer";
import { createFund } from "./createFund";
import { createFundraisingCampaign } from "./createFundraisingCampaign";
import { createGroupChat } from "./createGroupChat";
import { createMember } from "./createMember";
import { createMessageChat } from "./createMessageChat";
import { createOrganization } from "./createOrganization";
import { createPlugin } from "./createPlugin";
import { createPost } from "./createPost";
import { createSampleOrganization } from "./createSampleOrganization";
import { createUserFamily } from "./createUserFamily";
import { createUserTag } from "./createUserTag";
import { createVenue } from "./createVenue";
import { deleteVenue } from "./deleteVenue";
import { editVenue } from "./editVenue";
import { deleteAgendaCategory } from "./deleteAgendaCategory";
import { deleteDonationById } from "./deleteDonationById";
import { forgotPassword } from "./forgotPassword";
import { inviteEventAttendee } from "./inviteEventAttendee";
import { joinPublicOrganization } from "./joinPublicOrganization";
import { leaveOrganization } from "./leaveOrganization";
import { likeComment } from "./likeComment";
import { likePost } from "./likePost";
import { login } from "./login";
import { logout } from "./logout";
import { otp } from "./otp";
import { recaptcha } from "./recaptcha";
import { refreshToken } from "./refreshToken";
import { registerEventAttendee } from "./registerEventAttendee";
import { registerForEvent } from "./registerForEvent";
import { rejectAdmin } from "./rejectAdmin";
import { rejectMembershipRequest } from "./rejectMembershipRequest";
import { removeActionItem } from "./removeActionItem";
import { removeAdmin } from "./removeAdmin";
import { removeComment } from "./removeComment";
import { removeDirectChat } from "./removeDirectChat";
import { removeEvent } from "./removeEvent";
import { removeEventAttendee } from "./removeEventAttendee";
import { removeEventVolunteer } from "./removeEventVolunteer";
import { removeFund } from "./removeFund";
import { removeGroupChat } from "./removeGroupChat";
import { removeMember } from "./removeMember";
import { removeOrganization } from "./removeOrganization";
import { removeOrganizationCustomField } from "./removeOrganizationCustomField";
import { removeOrganizationImage } from "./removeOrganizationImage";
import { removePost } from "./removePost";
import { removeSampleOrganization } from "./removeSampleOrganization";
import { removeUserCustomData } from "./removeUserCustomData";
import { removeUserFamily } from "./removeUserFamily";
import { removeUserFromGroupChat } from "./removeUserFromGroupChat";
import { removeUserFromUserFamily } from "./removeUserFromUserFamily";
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
import { updateAdvertisement } from "./updateAdvertisement";
import { updateAgendaCategory } from "./updateAgendaCategory";
import { updateEvent } from "./updateEvent";
import { updateEventVolunteer } from "./updateEventVolunteer";
import { updateFund } from "./updateFund";
import { updateLanguage } from "./updateLanguage";
import { updateOrganization } from "./updateOrganization";
import { updatePluginStatus } from "./updatePluginStatus";
import { updatePost } from "./updatePost";
import { updateUserPassword } from "./updateUserPassword";
import { updateUserProfile } from "./updateUserProfile";
import { updateUserRoleInOrganization } from "./updateUserRoleInOrganization";
import { updateUserTag } from "./updateUserTag";
import { updateUserType } from "./updateUserType";
import { deleteAdvertisement } from "./deleteAdvertisement";
import { createAgendaItem } from "./createAgendaItem";
import { removeAgendaItem } from "./removeAgendaItem";
import { updateAgendaItem } from "./updateAgendaItem";

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
  addUserToUserFamily,
  removeUserFamily,
  removeUserFromUserFamily,
  createUserFamily,
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
  createAgendaCategory,
  createAgendaItem,
  createDirectChat,
  createDonation,
  createEvent,
  createFund,
  createFundraisingCampaign,
  createGroupChat,
  createMessageChat,
  createOrganization,
  createPlugin,
  createPost,
  createSampleOrganization,
  createActionItemCategory,
  createUserTag,
  createVenue,
  deleteDonationById,
  deleteAdvertisement,
  deleteVenue,
  editVenue,
  deleteAgendaCategory,
  forgotPassword,
  inviteEventAttendee,
  joinPublicOrganization,
  createEventVolunteer,
  leaveOrganization,
  likeComment,
  likePost,
  login,
  logout,
  otp,
  recaptcha,
  refreshToken,
  registerForEvent,
  registerEventAttendee,
  rejectAdmin,
  rejectMembershipRequest,
  removeAdmin,
  removeActionItem,
  removeAgendaItem,
  removeComment,
  removeDirectChat,
  removeEvent,
  removeEventAttendee,
  removeEventVolunteer,
  removeFund,
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
  updateAgendaCategory,
  updateAgendaItem,
  updateEvent,
  updateEventVolunteer,
  updateFund,
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
