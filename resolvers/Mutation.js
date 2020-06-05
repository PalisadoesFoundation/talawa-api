const { signUp } = require("./Auth.js");
const createOrganization = require("./mutations/createOrganization")
const updateOrganization = require("./mutations/updateOrganization")
const removeOrganization = require("./mutations/removeOrganization")
const User = require("../models/User");
const Organization = require("../models/Organization");

const Mutation = {
  signUp,
  createOrganization,
  updateOrganization,
  removeOrganization
};

module.exports = Mutation;
