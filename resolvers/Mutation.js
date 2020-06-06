const { signUp } = require("./Auth.js");
const createOrganization = require("./organization_mutations/createOrganization")
const updateOrganization = require("./organization_mutations/updateOrganization")
const removeOrganization = require("./organization_mutations/removeOrganization")
const createAdmin = require("./admin_mutations/createAdmin")
const removeAdmin = require("./admin_mutations/removeAdmin")
const joinOrganization = require("./member_mutations/join_organization")


const Mutation = {
  signUp,
  createOrganization,
  updateOrganization,
  removeOrganization,
  createAdmin,
  removeAdmin,
  joinOrganization
};

module.exports = Mutation;
