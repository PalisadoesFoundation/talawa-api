const User = require('../../models/User');
const GroupChat = require('../../models/GroupChat');
const authCheck = require('../functions/authCheck');
const adminCheck = require('../functions/adminCheck');
const organizationExists = require('../../helper_functions/organizationExists');

module.exports = async (parent, args, context, info) => {
  authCheck(context);

  try {
    let chat = await GroupChat.findById(args.chatId);
    if (!chat) throw new Error('Chat not found');

    const org = await organizationExists(chat.organization);

    adminCheck(context, org); // only an admin can add new users to the group chat -- may change in the future

    const userBeingAdded = await User.findById(args.userId);

    // ensure user isnt already a member
    const userAlreadyAMember = chat._doc.users.filter(
      (user) => user == args.userId
    );
    if (userAlreadyAMember.length > 0)
      throw new Error('User Already A Member of This Group Chat');

    return await GroupChat.findOneAndUpdate(
      { _id: args.chatId },
      {
        $set: {
          users: [...chat._doc.users, userBeingAdded],
        },
      },
      {
        new: true,
      }
    );
  } catch (e) {
    throw e;
  }
};
