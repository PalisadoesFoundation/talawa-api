const User = require("../../models/User");
const Organization = require("../../models/Organization");
const authCheck = require("../functions/authCheck");
const adminCheck = require("../functions/adminCheck");

module.exports = async (parent, args, context, info) => {
  authCheck(context);
  try {
    //ensure organization exists
    let org = await Organization.findOne({ _id: args.data.organizationId });
    if (!org) throw new Error("Organization not found");

    //ensure user is an admin
    adminCheck(context, org);

    let errors = [];
    

    for await (const userId of args.data.userIds) {
      // do not run an async function inside a for each loop - it doesnt work
      //ensure user exists
      const user = await User.findOne({ _id: userId });
      // Errors inside a loop stop the loop it doesnt throw the error, errors have to be stored in an array an thrown at the end
      if (!user) {
        errors.push("User does not exist");
        break;
      }
      //ensure member being removed by admin is already a member
      const members = org._doc.members.filter((member) => member == user.id);
      if (members.length == 0) {
        errors.push("User is not a member");
        break;
      }

      //ensure the user the admin is trying to remove isn't an admin
      if (org._doc.admins.includes(user.id)) {
        errors.push(
          "Administrators cannot remove members who are also Administrators"
        );
        break;
      }

      //ensure the user the admin is trying to remove isn't the creator
      if (org._doc.creator == user.id) {
        errors.push(
          "Administratos cannot remove the creator of the organization from the organization"
        );
        break;
      }

      //remove member from organization
      org = await Organization.findOneAndUpdate(
        { _id: org.id },
        {
          $set: {
            members: org._doc.members.filter((member) => member != user.id),
          },
        },
        {
          new: true,
        }
      );

      //remove org from user
      await User.findOneAndUpdate(
        { _id: user.id },
        {
          $set: {
            joinedOrganizations: user._doc.joinedOrganizations.filter(
              (organization) => organization != org.id
            ),
          },
        }
      );
    }

    if (errors.length > 0) throw new Error(errors.join());

    return org;
  } catch (e) {
    throw e;
  }
};
