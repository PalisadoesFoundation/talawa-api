const User = require("../../models/User");
const Organization = require("../../models/Organization");
const authCheck = require("../functions/authCheck");
const userExists = require("../../helper_functions/userExists")


const createOrganization = async (parent, args, context, info) => {
  //authentication check
  authCheck(context);

  try {
    //gets user in token - to be used later on
    let userFound = await userExists(membershipRequest.user);

    let newOrganization = new Organization({
      ...args.data,
      creator: context.userId,
      admins: [userFound],
      members: [userFound]
    });
    console.log(newOrganization._doc.admins);

    await newOrganization.save();

    //adds organization to users joined organizations field
    userFound.overwrite({
      ...userFound._doc,
      joinedOrganizations: [
        ...userFound._doc.joinedOrganizations,
        newOrganization,
      ],
      createdOrganization: [
        ...userFound._doc.createdOrganizations,
        newOrganization,
      ],
      adminFor: [...userFound._doc.adminFor, newOrganization],
    });
    await userFound.save();

    return {
      ...newOrganization._doc,
    };
  } catch (e) {
    throw e;
  }
};

module.exports = createOrganization;
