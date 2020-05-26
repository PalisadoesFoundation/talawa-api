const User = require("../../models/User");
const Organization = require("../../models/Organization");
const authCheck = require("../functions/authCheck");
const creatorCheck = require("../functions/creatorCheck");

const removeOrganizaiton = async (parent, args, context, info) => {
  authCheck(context);
  try {
    //checks to see if organization exists
    let org = await Organization.findOne({ _id: args.id });
    if (!org) throw new Error("Organization not found");

    //check if the user is an admin
    creatorCheck(context, org)

    //delete organzation
    await Organization.remove({_id: args.id})

    return org
  } catch (e) {
    throw e;
  }
};

module.exports = removeOrganizaiton;
