
const mongoose = require("mongoose");


const User = require("../../models/User");
const Organization = require("../../models/Organization");
const authCheck = require("../functions/authCheck");
const userExists = require("../../helper_functions/userExists")
const createOrganization = async (parent, args, context, info) => {
  //authentication check
  authCheck(context);

  try {
    //gets user in token - to be used later on
    let userFound = await userExists(context.userId);

    let newOrganization = new Organization({
      ...args.data,
      creator: mongoose.Types.ObjectId(context.userId),
      admins: [userFound],
      members: [userFound]
    });
    newOrganization = await newOrganization.save();


    //adds organization to users joined organizations field
    await userFound.updateOne(
      {_id: userFound.id},
      {$set: {
      joinedOrganizations: [
        ...userFound._doc.joinedOrganizations,
        newOrganization,
      ],
      createdOrganization: [
        ...userFound._doc.createdOrganizations,
        newOrganization,
      ],
      adminFor: [...userFound._doc.adminFor, newOrganization],
    }});


    return newOrganization._doc;
    
  } catch (e) {
    throw e;
  }
};

module.exports = createOrganization;
