const signUp = require('./auth_mutations/signup');
const login = require('./auth_mutations/login');
const refreshToken = require('./auth_mutations/refresh_token');
const revokeRefreshTokenForUser = require('./auth_mutations/revoke_refresh_token_for_user');

const createEvent = require('./event_mutations/createEvent');
const removeEvent = require('./event_mutations/removeEvent');
const updateEvent = require('./event_mutations/updateEvent');
const createOrganization = require('./organization_mutations/createOrganization');
const updateOrganization = require('./organization_mutations/updateOrganization');
const removeOrganization = require('./organization_mutations/removeOrganization');
const createAdmin = require('./admin_mutations/createAdmin');
const removeAdmin = require('./admin_mutations/removeAdmin');
const joinPublicOrganization = require('./member_mutations/join_public_organization');
const leaveOrganization = require('./member_mutations/leave_organization');

const removeMember = require('./member_mutations/removeMember');
//const removeMultipleMembers = require("./member_mutations/removeMultipleMembers");

const registerForEvent = require('./event_mutations/registerForEvent');

// const createEventProject = require("./event_project_mutations/createProject")
// const removeEventProject = require("./event_project_mutations/removeProject")
// const updateEventProject = require("./event_project_mutations/updateProject")

const createTask = require('./project_task_mutations/createTask');
const removeTask = require('./project_task_mutations/removeTask');
const updateTask = require('./project_task_mutations/updateTask');

const adminRemovePost = require('./admin_mutations/admin-remove-post');
const adminRemoveEvent = require('./admin_mutations/admin-remove-event');
const adminRemoveGroup = require('./admin_mutations/admin-remove-group-chat');

const createPost = require('./post_mutations/createPost');
const removePost = require('./post_mutations/removePost');
const createComment = require('./post_mutations/createComment');
const removeComment = require('./post_mutations/removeComment');
const likeComment = require('./post_mutations/likeComment');
const unlikeComment = require('./post_mutations/unlikeComment');
const likePost = require('./post_mutations/likePost');
const unlikePost = require('./post_mutations/unlikePost');

const sendMembershipRequest = require('./membership_request_mutations/send_membership_request');
const acceptMembershipRequest = require('./membership_request_mutations/accept_membership_request');
const rejectMembershipRequest = require('./membership_request_mutations/reject_membership_request');
const cancelMembershipRequest = require('./membership_request_mutations/cancel_membership_request');

const blockUser = require('./block_user_mutations/block_user');
const unblockUser = require('./block_user_mutations/unblock_user');

const addUserImage = require('./user_image_mutations/add_user_image');
const removeUserImage = require('./user_image_mutations/remove_user_image');

const addOrganizationImage = require('./organization_image_mutations/add_organization_image');
const removeOrganizationImage = require('./organization_image_mutations/remove_organization_image');

const createDirectChat = require('./direct_chat_mutations/createDirectChat');
const removeDirectChat = require('./direct_chat_mutations/removeDirectChat');
const sendMessageToDirectChat = require('./direct_chat_mutations/sendMessageToDirectChat');

const createGroupChat = require('./group_chat_mutations/createGroupChat');
const removeGroupChat = require('./group_chat_mutations/removeGroupChat');
const sendMessageToGroupChat = require('./group_chat_mutations/sendMessageToGroupChat');
const addUserToGroupChat = require('./group_chat_mutations/addUserToGroupChat');
const removeUserFromGroupChat = require('./group_chat_mutations/removeUserFromGroupChat');
const updateLanguage = require('./language_mutation/updateLanguage');

const Mutation = {
  signUp,
  login,
  refreshToken,
  revokeRefreshTokenForUser,
  updateLanguage,

  createOrganization,
  createEvent,
  removeEvent,
  updateEvent,
  updateOrganization,
  removeOrganization,
  createAdmin,
  removeAdmin,
  joinPublicOrganization,
  leaveOrganization,

  removeMember,
  //removeMultipleMembers,

  adminRemovePost,
  adminRemoveGroup,
  adminRemoveEvent,
  registerForEvent,
  // createEventProject,
  // removeEventProject,
  // updateEventProject,
  createPost,
  removePost,
  likePost,
  unlikePost,
  createTask,
  removeTask,
  updateTask,
  sendMembershipRequest,
  acceptMembershipRequest,
  rejectMembershipRequest,
  cancelMembershipRequest,

  blockUser,
  unblockUser,

  createComment,
  removeComment,
  likeComment,
  unlikeComment,

  addUserImage,
  removeUserImage,
  addOrganizationImage,
  removeOrganizationImage,

  createDirectChat,
  removeDirectChat,
  sendMessageToDirectChat,

  createGroupChat,
  removeGroupChat,
  sendMessageToGroupChat,
  addUserToGroupChat,
  removeUserFromGroupChat,
};

module.exports = Mutation;
