const User = require("../models/User");
const Organization = require("../models/Organization");
const { login } = require("./Auth");
const authCheck = require("./functions/authCheck");

const Query = {
  users: async (parent, args, context, info) => {
    try {
      if (args.id) {
        const users = await User.find({ _id: args.id });
        if (!users[0]) throw new Error("User not found");
        else
          return users.map((user) => {
            return {
              ...user._doc,
              password: null,
            };
          });
      } else {
        const users = await User.find();
        return users.map((user) => {
          return { ...user._doc, password: null };
        });
      }
    } catch (e) {
      throw e;
    }
  },
  me: async (parent, args, context, info) => {
    authCheck(context);
    try {
      //Ensure user exists
      const user = await User.findOne({ _id: context.userId });
      if(!user) throw new Error("User does not exist")
      console.log(user._doc)

      return user._doc
    } catch (e) {
      throw e;
    }
  },
  login,
  organizations: async (parent, args, context, info) => {
    try {
      if (args.id) {
        const organizationFound = await Organization.find({ _id: args.id });
        if (!organizationFound[0]) {
          throw new Error("Organization not found");
        }
        return organizationFound;
      } else {
        return await Organization.find();
      }
    } catch (e) {
      throw e;
    }
  },
};

module.exports = Query;
