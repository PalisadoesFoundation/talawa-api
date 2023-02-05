import { nanoid } from "nanoid";
import {
  DirectChat,
  DirectChatMessage,
  Interface_DirectChat,
} from "../../src/models";
import {
  createTestUserAndOrganization,
  testOrganizationType,
  testUserType,
} from "./userAndOrg";
import { Document } from "mongoose";

export type testDirectChatType =
  | (Interface_DirectChat & Document<any, any, Interface_DirectChat>)
  | null;

export const createTestDirectChat = async (): Promise<
  [testUserType, testOrganizationType, testDirectChatType]
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
  [testUserType, testOrganizationType, testDirectChatType]
> => {
  const [testUser, testOrganization, testDirectChat] =
    await createTestDirectChat();

  await DirectChatMessage.create({
    directChatMessageBelongsTo: testDirectChat!._id,
    sender: testUser!._id,
    receiver: testUser!._id,
    createdAt: new Date(),
    messageContent: `msgContent${nanoid().toLowerCase()}`,
  });

  return [testUser, testOrganization, testDirectChat];
};

export const createTestDirectMessageForMultipleUser = async(
  sender_id: string,
  receiver_id: string,
  organization_id: string,
): Promise<testDirectChatType> => {
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
}