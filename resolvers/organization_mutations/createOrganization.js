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

    //makes the creator an admin of the organization
    newOrganization.admins.push(userFound);



    //makes the creator a member of the organization
    newOrganization.overwrite({
      ...newOrganization._doc,
      members: [...newOrganization._doc.members, userFound]
    })

    newOrganization = await newOrganization.save();
    
    //adds organization to users joined organizations field
    userFound.overwrite({
      ...userFound._doc,
      joinedOrganizations: [...userFound._doc.joinedOrganizations, newOrganization]
    })
    await userFound.save()

    //add organization to the creator's createdOrganizations field
    await User.updateOne(
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
