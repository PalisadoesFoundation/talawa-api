import { nanoid } from "nanoid";
import type {
  InterfaceDirectChat,
  InterfaceDirectChatMessage,
} from "../../src/models";
import { DirectChat, DirectChatMessage } from "../../src/models";
import type { TestOrganizationType, TestUserType } from "./userAndOrg";
import { createTestUserAndOrganization } from "./userAndOrg";
import type { Document } from "mongoose";

export type TestDirectChatType =
  | (InterfaceDirectChat & Document<unknown, unknown, InterfaceDirectChat>)
  | null;

export type TestDirectChatMessageType =
  | (InterfaceDirectChatMessage &
      Document<unknown, unknown, InterfaceDirectChatMessage>)
  | null;

export const createTestDirectChat = async (): Promise<
  [TestUserType, TestOrganizationType, TestDirectChatType]
> => {
  const [testUser, testOrganization] = await createTestUserAndOrganization();
  if (testUser && testOrganization) {
    const testDirectChat = await DirectChat.create({
      creatorId: testUser._id,
      users: [testUser._id],
      organization: testOrganization._id,
    });

    return [testUser, testOrganization, testDirectChat];
  } else {
    return [testUser, testOrganization, null];
  }
};

export const createTestDirectChatMessage = async (): Promise<
  [
    TestUserType,
    TestOrganizationType,
    TestDirectChatType,
    TestDirectChatMessageType,
  ]
> => {
  const [testUser, testOrganization, testDirectChat] =
    await createTestDirectChat();

  if (testDirectChat && testUser) {
    const testDirectChatMessage = await DirectChatMessage.create({
      directChatMessageBelongsTo: testDirectChat._id,
      sender: testUser._id,
      receiver: testUser._id,
      messageContent: `msgContent${nanoid().toLowerCase()}`,
    });
    return [testUser, testOrganization, testDirectChat, testDirectChatMessage];
  } else {
    return [testUser, testOrganization, testDirectChat, null];
  }
};

export const createTestDirectMessageForMultipleUser = async (
  senderId: string,
  receiverId: string,
  organizationId: string,
): Promise<TestDirectChatType> => {
  const testDirectChat = await DirectChat.create({
    creatorId: senderId,
    users: [senderId],
    organization: organizationId,
  });

  await DirectChatMessage.create({
    directChatMessageBelongsTo: testDirectChat._id,
    sender: senderId,
    receiver: receiverId,
    messageContent: `messageContent${nanoid().toLowerCase()}`,
  });

  return testDirectChat;
};

export const createTestDirectChatwithUsers = async (
  creator: string,
  organizationId: string,
  users: string[],
): Promise<TestDirectChatType> => {
  const testDirectChat = await DirectChat.create({
    creatorId: creator,
    users: users,
    organization: organizationId,
  });
  return testDirectChat;
};

export const createDirectChatMessage = async (
  senderId: string,
  receiverId: string,
  directChatId: string,
): Promise<TestDirectChatMessageType> => {
  const directChatMessage = await DirectChatMessage.create({
    directChatMessageBelongsTo: directChatId,
    sender: senderId,
    receiver: receiverId,
    messageContent: `messageContent${nanoid().toLowerCase()}`,
  });

  return directChatMessage;
};
