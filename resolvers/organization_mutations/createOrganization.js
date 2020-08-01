const mongoose = require("mongoose");

const User = require("../../models/User");
const Organization = require("../../models/Organization");
const authCheck = require("../functions/authCheck");
const userExists = require("../../helper_functions/userExists");
const createOrganization = async (parent, args, context, info) => {
  //authentication check
  authCheck(context);

  try {
    //gets user in token - to be used later on
    let userFound = await User.findOne({ _id: context.userId });
    if (!userFound) throw new Error("User does not exist");

    let newOrganization = new Organization({
      ...args.data,
      creator: userFound,
      admins: [userFound],
      members: [userFound],
    });
    await newOrganization.save();

    await User.findOneAndUpdate(
      { _id: userFound.id },
      {
        $set: {
          joinedOrganizations: [
            ...userFound._doc.joinedOrganizations,
            newOrganization,
          ],
          createdOrganizations: [
            ...userFound._doc.createdOrganizations,
            newOrganization,
          ],
          adminFor: [...userFound._doc.adminFor, newOrganization],
        },
      }
    );

    // await userFound.overwrite({
    //   ...userFound._doc,
    //   joinedOrganizations: [...userFound._doc.joinedOrganizations, newOrganization],
    //   createdOrganizations: [...userFound._doc.createdOrganizations, newOrganization],
    //   adminFor: [...userFound._doc.adminFor, newOrganization]
    // });

    return newOrganization._doc;
  } catch (e) {
    throw e;
  }
};

module.exports = createOrganization;
