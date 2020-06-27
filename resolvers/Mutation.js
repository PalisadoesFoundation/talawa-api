const { signUp } = require("./Auth.js");
const createEvent = require("./event_mutations/createEvent")
const removeEvent = require("./event_mutations/removeEvent")
const updateEvent = require("./event_mutations/updateEvent")
const createOrganization = require("./organization_mutations/createOrganization")
const updateOrganization = require("./organization_mutations/updateOrganization")
const removeOrganization = require("./organization_mutations/removeOrganization")
const createAdmin = require("./admin_mutations/createAdmin")
const removeAdmin = require("./admin_mutations/removeAdmin")
const joinPublicOrganization = require("./member_mutations/join_public_organization")
const leaveOrganization = require("./member_mutations/leave_organization")
const removeMember = require("./member_mutations/removeMember")
const registerForEvent = require("./event_mutations/registerForEvent")

const createEventProject = require("./event_project_mutations/createProject")
const removeEventProject = require("./event_project_mutations/removeProject")
const updateEventProject = require("./event_project_mutations/updateProject")


const adminRemovePost = require("./admin_mutations/admin-remove-post");
const adminRemoveEvent = require("./admin_mutations/admin-remove-event");
const adminRemoveGroup = require("./admin_mutations/admin-remove-group-chat");

const createPost = require("./post_mutations/create_post")

const createGroup = require("./group_chat_mutations/create_group_chat")



const Mutation = {
  signUp,
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
  adminRemovePost,
  adminRemoveGroup,
  adminRemoveEvent,
  registerForEvent,
  createEventProject,
  removeEventProject,
  updateEventProject,
  createPost,
  createGroup
};

module.exports = Mutation;
