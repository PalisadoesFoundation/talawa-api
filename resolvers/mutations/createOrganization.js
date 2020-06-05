const User = require("../../models/User");
const Organization = require("../../models/Organization");

const createOrganization = async (parent, args, context, info) => {
  //authentication check
  if (!context.isAuth) throw new Error("User is not authenticated");

  try {
    //gets user in token - to be used later on
    let userFound = await User.findOne({ _id: context.userId });
    if (!userFound) {
      throw new Error("User does not exist");
    }

    let newOrganization = new Organization({
      ...args.data,
      creator: context.userId
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
