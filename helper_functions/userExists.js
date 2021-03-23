const User = require("../models/User");

module.exports = async (id) => {
    const user = await User.findOne({ _id: id });
    if (!user) throw Apperror("User does not exist");
    return user;
};
