const Organization = require('../../models/Organization');
const authCheck = require('../functions/authCheck');
const adminCheck = require('../functions/adminCheck');

const updateOrganization = async (parent, args, context, info) => {
  authCheck(context);
  try {
    //checks to see if organization exists
    let org = await Organization.findOne({ _id: args.id });
    if (!org) throw new Error('Organization not found');

    //check if the user is an admin
    adminCheck(context, org);

    //UPDATE ORGANIZATION
    org.overwrite({
      ...org._doc,
      ...args.data,
    });
    await org.save();

    return org;
  } catch (e) {
    throw e;
  }
};

module.exports = updateOrganization;
