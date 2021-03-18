const GroupChat = require("../../models/GroupChat");
const authCheck = require("../functions/authCheck");
const adminCheck = require("../functions/adminCheck");
const organizationExists = require("../../helper_functions/organizationExists");
const GroupChatMessage = require("../../models/GroupChatMessage");

// admins of the organization can remove chats -- may change in the future

module.exports = async (parent, args, context, info) => {
  try{
  authCheck(context);

  const chat = await GroupChat.findById(args.chatId);
  if (!chat) throw new Error("Chat not found");

  const org = await organizationExists(chat.organization);


  adminCheck(context, org);

  // delete all messages in the chat
  await GroupChatMessage.deleteMany({
    _id: {
      $in: [...chat.messages],
    },
  });

  await GroupChat.deleteOne({_id: args.chatId})

  return chat;
  }catch(e){
    throw e;
  }
};
