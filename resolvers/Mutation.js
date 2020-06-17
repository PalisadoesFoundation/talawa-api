const { signUp } = require("./Auth.js");
const createOrganization = require("./organization_mutations/createOrganization")
const updateOrganization = require("./organization_mutations/updateOrganization")
const removeOrganization = require("./organization_mutations/removeOrganization")
const createAdmin = require("./admin_mutations/createAdmin")
const removeAdmin = require("./admin_mutations/removeAdmin")
const joinPublicOrganization = require("./member_mutations/join_public_organization")
const leaveOrganization = require("./member_mutations/leave_organization")
const removeMember = require("./member_mutations/removeMember")

const adminRemovePost = require("./admin_mutations/admin-remove-post");
const adminRemoveEvent = require("./admin_mutations/admin-remove-event");
const adminRemoveGroupChat = require("./admin_mutations/admin-remove-group-chat");

const Mutation = {
  signUp,
  createOrganization,
  updateOrganization,
  removeOrganization,
  createAdmin,
  removeAdmin,
  joinPublicOrganization,
  leaveOrganization,
  removeMember,
  adminRemovePost,
  adminRemoveGroupChat,
  adminRemoveEvent
};

module.exports = Mutation;
