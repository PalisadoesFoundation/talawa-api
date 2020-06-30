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

const createTask = require("./project_task_mutations/createTask")
const removeTask = require("./project_task_mutations/removeTask")
const updateTask = require("./project_task_mutations/updateTask")

const adminRemovePost = require("./admin_mutations/admin-remove-post");
const adminRemoveEvent = require("./admin_mutations/admin-remove-event");
const adminRemoveGroupChat = require("./admin_mutations/admin-remove-group-chat");

const createPost = require("./post_mutations/create_post")

const createGroupChat = require("./group_chat_mutations/create_group_chat")



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
  adminRemoveGroupChat,
  adminRemoveEvent,
  registerForEvent,
  createEventProject,
  removeEventProject,
  updateEventProject,
  createPost,
  createGroupChat,
  createTask,
  removeTask,
  updateTask,
};

module.exports = Mutation;
