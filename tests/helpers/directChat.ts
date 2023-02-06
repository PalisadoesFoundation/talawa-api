import { nanoid } from "nanoid";
import {
  DirectChat,
  DirectChatMessage,
  Interface_DirectChat,
  Interface_DirectChatMessage,
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

export type TestDirectChatMessageType =
  | (Interface_DirectChatMessage &
      Document<any, any, Interface_DirectChatMessage>)
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
  [
    testUserType,
    testOrganizationType,
    testDirectChatType,
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
