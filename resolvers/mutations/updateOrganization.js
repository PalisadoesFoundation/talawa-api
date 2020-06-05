const User = require("../../models/User");
const Organization = require("../../models/Organization");
const authCheck = require("../functions/authCheck");
const adminCheck = require("../functions/adminCheck");


const updateOrganization = async (parent, args, context, info) => {
  authCheck(context);
  try {
    //checks to see if organization exists
    let org = await Organization.findOne({ _id: args.data.id });
    if (!org) throw new Error("Organization not found");

    //check if the user is an admin
    adminCheck(context, org)

    //updates fields in organization depending on whether or not they were sent as arguments in the request
    let orgUpdate = await Organization.updateOne(
      { _id: org._id },
      {
        $set: {
          name: args.data.name ? args.data.name : org.name,
          description: args.data.description
            ? args.data.description
            : org.description,
          isPublic:
            typeof args.data.isPublic === "boolean"
              ? args.data.isPublic
              : org.isPublic,
        },
      }
    );

    //retrieves updated organization from database
    org = await Organization.findOne({ _id: args.data.id });

    return org;
  } catch (e) {
    throw e;
  }
};

module.exports = updateOrganization;
