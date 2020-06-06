const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const signUp = async (parent, args, context, info) => {
  try {
    const emailTaken = await User.findOne({ email: args.data.email });
    if (emailTaken) {
      throw new Error("Email address taken.");
    }

    const hashedPassword = await bcrypt.hash(args.data.password, 12);

    let user = new User({
      ...args.data,
      password: hashedPassword,
    });

    user = await user.save();

    const token = await jwt.sign(
      { userId: user.id, email: user.email },
      "somesupersecretkey"
    );
    return {
      userId: user.id,
      token: token,
    };

    //return { ...user._doc, password:null };
  } catch (e) {
    throw e;
  }
};

const login = async (parent, args, context, info) => {
  try {
    const user = await User.findOne({ email: args.data.email });
    if (!user) {
      throw new Error("Invalid Credentials");
    }

    const isEqual = await bcrypt.compare(
      args.data.password,
      user._doc.password
    );

    if (!isEqual) {
      throw new Error("Invalid Credentials");
    }

    const token = await jwt.sign(
      { userId: user.id, email: user.email },
      "somesupersecretkey"
    );
    return {
      userId: user.id,
      token: token,
    };
    //the key should be changed for production
  } catch (e) {
    throw e;
  }
};

module.exports.signUp = signUp;
module.exports.login = login;
