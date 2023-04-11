import { nanoid } from "nanoid";
import {
  DirectChat,
  DirectChatMessage,
  InterfaceDirectChat,
  InterfaceDirectChatMessage,
} from "../../src/models";
import {
  createTestUserAndOrganization,
  TestOrganizationType,
  TestUserType,
} from "./userAndOrg";
import { Document } from "mongoose";

export type TestDirectChatType =
  | (InterfaceDirectChat & Document<any, any, InterfaceDirectChat>)
  | null;

export type TestDirectChatMessageType =
  | (InterfaceDirectChatMessage &
      Document<any, any, InterfaceDirectChatMessage>)
  | null;

export const createTestDirectChat = async (): Promise<
  [TestUserType, TestOrganizationType, TestDirectChatType]
> => {
  const [testUser, testOrganization] = await createTestUserAndOrganization();
  const testDirectChat = await DirectChat.create({
    creator: testUser!._id,
    users: [testUser!._id],
    organization: testOrganization!._id,
  });

  return [testUser, testOrganization, testDirectChat];
};

export const createTestDirectChatMessage = async (): Promise<
  [
    TestUserType,
    TestOrganizationType,
    TestDirectChatType,
    TestDirectChatMessageType
  ]
> => {
  const [testUser, testOrganization, testDirectChat] =
    await createTestDirectChat();

  const testDirectChatMessage = await DirectChatMessage.create({
    directChatMessageBelongsTo: testDirectChat!._id,
    sender: testUser!._id,
    receiver: testUser!._id,
    createdAt: new Date(),
    messageContent: `msgContent${nanoid().toLowerCase()}`,
  });

  return [testUser, testOrganization, testDirectChat, testDirectChatMessage];
};

export const createTestDirectMessageForMultipleUser = async (
  sender_id: string,
  receiver_id: string,
  organization_id: string
): Promise<TestDirectChatType> => {
  const testDirectChat = await DirectChat.create({
    creator: sender_id,
    users: [sender_id],
    organization: organization_id,
  });

  await DirectChatMessage.create({
    directChatMessageBelongsTo: testDirectChat._id,
    sender: sender_id,
    receiver: receiver_id,
    createdAt: new Date(),
    messageContent: `messageContent${nanoid().toLowerCase()}`,
  });

  return testDirectChat;
};

export const createTestDirectChatwithUsers = async (
  creator: string,
  organization_id: string,
  users: string[]
): Promise<TestDirectChatType> => {
  const testDirectChat = await DirectChat.create({
    creator: creator,
    users: users,
    organization: organization_id,
  });
  return testDirectChat;
};

export const createDirectChatMessage = async (
  sender_id: string,
  receiver_id: string,
  direct_chat_id: string
): Promise<TestDirectChatMessageType> => {
  const directChatMessage = await DirectChatMessage.create({
    directChatMessageBelongsTo: direct_chat_id,
    sender: sender_id,
    receiver: receiver_id,
    createdAt: new Date(),
    messageContent: `messageContent${nanoid().toLowerCase()}`,
  });

  return directChatMessage;
};
