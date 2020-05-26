const User = require("../../models/User");
const Organization = require("../../models/Organization");

const createOrganization = async (parent, args, context, info) => {
  //authentication check
  if (!context.isAuth) throw new Error("User is not authenticated");

  try {
    //check to see if user in the creator field exists
    let userFound = await User.findOne({ _id: args.data.creator });
    if (!userFound) {
      throw new Error("User does not exist");
    }

    let newOrganization = new Organization({
      ...args.data,
    });

    newOrganization.admins.push(userFound);

    newOrganization = await newOrganization.save();

    //add organization to the creator's createdOrganizations field
    let updatedUser = await User.updateOne(
      { _id: userFound.id },
      {
        $set: {
          createdOrganizations: [
            ...userFound.createdOrganizations,
            newOrganization,
          ],
          adminFor: [...userFound.createdOrganizations, newOrganization],
        },
      }
    );

    return {
      ...newOrganization._doc,
    };
  } catch (e) {
    throw e;
  }
};

module.exports = createOrganization;
