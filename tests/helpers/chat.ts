import { nanoid } from "nanoid";
import type { InterfaceChat, InterfaceChatMessage } from "../../src/models";
import { Chat, ChatMessage } from "../../src/models";
import type { TestOrganizationType, TestUserType } from "./userAndOrg";
import { createTestUserAndOrganization } from "./userAndOrg";
import type { Document } from "mongoose";

export type TestChatType =
  | (InterfaceChat & Document<unknown, unknown, InterfaceChat>)
  | null;

export type TestChatMessageType =
  | (InterfaceChatMessage & Document<unknown, unknown, InterfaceChatMessage>)
  | null;

export const createTestChat = async (): Promise<
  [TestUserType, TestOrganizationType, TestChatType]
> => {
  const [testUser, testOrganization] = await createTestUserAndOrganization();
  if (testUser && testOrganization) {
    const testChat = await Chat.create({
      creatorId: testUser._id,
      users: [testUser._id],
      organization: testOrganization._id,
      isGroup: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      admins: [testUser._id],
    });

    return [testUser, testOrganization, testChat];
  } else {
    return [testUser, testOrganization, null];
  }
};

export const createTestChatMessage = async (): Promise<
  [TestUserType, TestOrganizationType, TestChatType, TestChatMessageType]
> => {
  const [testUser, testOrganization, testChat] = await createTestChat();

  if (testChat?.id) {
    const chatMessage = await createChatMessage(
      testUser?._id,
      testChat?._id.toString(),
    );

    if (testChat && testUser) {
      const testChatMessage = await ChatMessage.create({
        chatMessageBelongsTo: testChat._id,
        sender: testUser._id,
        replyTo: chatMessage?._id,
        messageContent: `msgContent${nanoid().toLowerCase()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        type: "STRING",
      });
      return [testUser, testOrganization, testChat, testChatMessage];
    } else {
      return [testUser, testOrganization, testChat, null];
    }
  }
  return [testUser, testOrganization, testChat, null];
};

export const createTestChatMessageWithoutReply = async (): Promise<
  [TestUserType, TestOrganizationType, TestChatType, TestChatMessageType]
> => {
  const [testUser, testOrganization, testChat] = await createTestChat();

  if (testChat && testUser) {
    const testChatMessage = await ChatMessage.create({
      chatMessageBelongsTo: testChat._id,
      sender: testUser._id,
      replyTo: undefined,
      messageContent: `msgContent${nanoid().toLowerCase()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      type: "STRING",
    });
    return [testUser, testOrganization, testChat, testChatMessage];
  } else {
    return [testUser, testOrganization, testChat, null];
  }
};

export const createTestMessageForMultipleUser = async (
  senderId: string,
  organizationId: string,
): Promise<TestChatType> => {
  const testChat = await Chat.create({
    creatorId: senderId,
    users: [senderId],
    organization: organizationId,
  });

  await ChatMessage.create({
    chatMessageBelongsTo: testChat._id,
    sender: senderId,
    messageContent: `messageContent${nanoid().toLowerCase()}`,
    createdAt: new Date(),
    updatedAt: new Date(),
    type: "STRING",
  });

  return testChat;
};

export const createTestChatwithUsers = async (
  creator: string,
  organizationId: string,
  users: string[],
): Promise<TestChatType> => {
  const testChat = await Chat.create({
    creatorId: creator,
    users: users,
    organization: organizationId,
    isGroup: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return testChat;
};

export const createChatMessage = async (
  senderId: string,
  chatId: string,
): Promise<TestChatMessageType> => {
  const chatMessage = await ChatMessage.create({
    chatMessageBelongsTo: chatId,
    sender: senderId,
    type: "STRING",
    messageContent: `messageContent${nanoid().toLowerCase()}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return chatMessage;
};
