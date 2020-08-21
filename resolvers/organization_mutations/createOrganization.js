const mongoose = require("mongoose");

const User = require("../../models/User");
const Organization = require("../../models/Organization");
const authCheck = require("../functions/authCheck");
const userExists = require("../../helper_functions/userExists");

const shortid = require("shortid");
const { createWriteStream, unlink } = require("fs");
const path = require("path")
const imageAlreadyInDbCheck = require("../../helper_functions/imageAlreadyInDbCheck")



const createOrganization = async (parent, args, context, info) => {
  //authentication check
  authCheck(context);

  try {
    //gets user in token - to be used later on
    let userFound = await User.findOne({ _id: context.userId });
    if (!userFound) throw new Error("User does not exist");

    
    let organizationImage;
    if (args.file) {

      const id = shortid.generate();

      const { createReadStream, filename } = await args.file;

      const upload = await new Promise((res) =>
        createReadStream().pipe(
          createWriteStream(
            path.join(__dirname, "../../images", `/${id}-${filename}`)
          )
        )
          .on("close", res)
      );

      organizationImage = `images/${id}-${filename}`
    }

    let orgImageAlreadyInDb = await imageAlreadyInDbCheck(organizationImage, null); 


    let newOrganization = new Organization({
      ...args.data,
      image: orgImageAlreadyInDb ? orgImageAlreadyInDb : organizationImage,
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

    return newOrganization._doc;
  } catch (e) {
    throw e;
  }
};

module.exports = createOrganization;
